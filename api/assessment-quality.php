<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }

function assessment_quality_records(array $state): array {
    return array_map(function($record) {
        // Read old rows without guessing their exam mode, maps, or publication type.
        $record['members']=$record['members']??[['number'=>$record['number'],'orderId'=>$record['orderId']]];
        $record['maps']=$record['maps']??[];
        return $record;
    },array_values($state['assessmentQuality']??[]));
}
function assessment_quality_search_text(array $record): string {
    $parts=[$record['grade'],...($record['maps']??[])];
    foreach($record['members']??[['number'=>$record['number'],'orderId'=>$record['orderId']]] as $member) {
        $parts[]=$member['number'];$parts[]=$member['orderId'];
    }
    return implode(' ',$parts);
}
// Historical records have no verified type and remain private until classified.
function assessment_priority_records(array $state): array {
    return array_values(array_filter(assessment_quality_records($state),fn($r)=>($r['type']??'')==='priority'));
}
function assessment_quality_summary(array $state): array {
    $all=assessment_priority_records($state);
    return ['items'=>array_slice($all,0,8),'total'=>count($all),'version'=>$state['assessmentQualityVersion']??'initial'];
}
function assessment_quality_list(array $state): never {
    $q=is_string($_GET['q']??null)?trim($_GET['q']):'';
    if (strlen($q)>180) fail('搜索内容过长');
    $page=is_string($_GET['page']??null)?$_GET['page']:'1';
    if (!preg_match('/^[1-9][0-9]{0,5}$/D',$page)) fail('页码无效');
    $all=array_values(array_filter(assessment_priority_records($state),fn($r)=>$q===''||stripos(assessment_quality_search_text($r),$q)!==false));
    $pages=max(1,(int)ceil(count($all)/50));$current=min((int)$page,$pages);
    reply(['items'=>array_slice($all,($current-1)*50,50),'total'=>count($all),'page'=>$current,'pages'=>$pages]);
}
function assessment_quality_manage(string $action): never {
    $id=field('id');$version=field('version');$isNew=$id==='';$deleting=$action==='assessment-quality-delete';
    if (($deleting&&$isNew)||(!$isNew&&!preg_match('/^[a-f0-9]{24}$/D',$id))) fail('名单条目无效');
    if ($isNew) $id=bin2hex(random_bytes(12));
    $item=[];
    if (!$deleting) {
        $type=field('type');
        if (!in_array($type,['priority','after-sales','unclassified'],true)) fail('请选择有效的质检类型');
        $grade=field('grade');
        if (!in_array($grade,['单考魔王','双考魔王','单考顶尖','双考顶尖','单考pro','双考pro'],true)) fail('请选择单考或双考的考核等级');
        try {
            $members=json_decode(field('members'),true,8,JSON_THROW_ON_ERROR);
            $maps=json_decode(field('maps'),true,8,JSON_THROW_ON_ERROR);
        } catch(Throwable $e) { fail('成员或地图格式不正确，请刷新后重试'); }
        if (!is_array($members)||!array_is_list($members)||count($members)<1||count($members)>2) fail('每组需填写1至2位成员');
        $clean=[];$numbers=[];
        foreach($members as $member) {
            if (!is_array($member)) fail('成员信息格式不正确');
            $person=[];
            foreach(['number','orderId'] as $key) {
                $value=$member[$key]??null;
                if (!is_string($value)||trim($value)===''||strlen(trim($value))>90||preg_match('/[\x00-\x1f]/',$value)) fail('每位成员的编号、结单ID均需填写，最多30个汉字');
                $person[$key]=trim($value);
            }
            if (in_array($person['number'],$numbers,true)) fail('同组两位成员的编号不可重复');
            $numbers[]=$person['number'];$clean[]=$person;
        }
        if (!is_array($maps)||!array_is_list($maps)||count($maps)<1||count($maps)>3) fail('请至少选择一张质检地图');
        foreach($maps as $map) if (!is_string($map)||!in_array($map,['航天','监狱','巴克什'],true)) fail('质检地图无效');
        $maps=array_values(array_filter(['航天','监狱','巴克什'],fn($map)=>in_array($map,$maps,true)));
        $item=$clean[0]+['members'=>$clean,'maps'=>$maps,'grade'=>$grade,'type'=>$type];
    }
    $result=join_update(function(array &$s)use($id,$version,$isNew,$deleting,$item){
        if (!authenticated($s)) return 'auth';
        $old=$s['assessmentQuality'][$id]??null;
        if (!$isNew&&!$old) return 'missing';
        if ($old&&!hash_equals($old['version'],$version)) return 'conflict';
        if ($isNew&&count($s['assessmentQuality']??[])>=2000) return 'limit';
        if ($deleting) { unset($s['assessmentQuality'][$id]);join_audit($s,'删除质检通过名单：'.$old['number']); }
        else {
            foreach($s['assessmentQuality']??[] as $otherId=>$other) {
                if ($otherId===$id) continue;
                foreach($other['members']??[['number'=>$other['number']]] as $person) {
                    foreach($item['members'] as $member) if ($person['number']===$member['number']) return 'duplicate';
                }
            }
            $record=$item+['id'=>$id,'version'=>bin2hex(random_bytes(12)),'createdAt'=>$old['createdAt']??date(DATE_ATOM),'updatedAt'=>date(DATE_ATOM)];
            if ($isNew) $s['assessmentQuality']=[$id=>$record]+($s['assessmentQuality']??[]);else $s['assessmentQuality'][$id]=$record;
            join_audit($s,'保存质检通过名单：'.$item['number']);
        }
        $s['assessmentQualityVersion']=bin2hex(random_bytes(12));
        return ['ok'=>true,'quality'=>assessment_quality_summary($s),'qualityRecords'=>assessment_quality_records($s)];
    });
    if (is_string($result)) {
        $errors=['auth'=>['登录已失效',401],'missing'=>['名单条目已删除，请刷新',404],'conflict'=>['其他管理员已修改此条目，请刷新后再保存',409],'duplicate'=>['此编号已存在，请使用其他编号或编辑原条目',409],'limit'=>['最多支持2000条名单',409]];
        fail(...$errors[$result]);
    }
    reply($result);
}
function assessment_contact_defaults(): array {
    return [
        'report'=>['name'=>'钱多多','src'=>'images/assessment/qianduoduo-contact.png','contactUrl'=>'','display'=>'legacy'],
        'service-1'=>['name'=>'客服1号','src'=>'images/customer-service/service-1-8510618ecc15.png','contactUrl'=>'https://work.weixin.qq.com/u/vcc26e424291b9f8fc?v=5.0.9.75230&bb=c6dda878b8'],
        'service-2'=>['name'=>'客服2号','src'=>'images/customer-service/service-2-b371466c4f9e.png','contactUrl'=>'https://work.weixin.qq.com/u/vc06565ef063ed54d0?v=5.0.9.76561&bb=64d8e5e153'],
        'service-3'=>['name'=>'客服3号','src'=>'images/customer-service/service-3-5223963d0aa7.png','contactUrl'=>'https://work.weixin.qq.com/u/vc002c333b182d7ced?v=5.0.8.70675&bb=16a6677f85'],
        'service-4'=>['name'=>'客服4号','src'=>'images/customer-service/service-4-84235c22b00e.png','contactUrl'=>'https://work.weixin.qq.com/u/vccc36d6bfcbd90d00?v=5.0.9.76561&bb=b8b7deae41'],
        'service-vip'=>['name'=>'VIP专属客服','src'=>'images/customer-service/service-vip-18748a91f424.png','contactUrl'=>'https://work.weixin.qq.com/u/vccab52cb04054f9ff?v=5.0.8.70675&bb=545b8a525e']
    ];
}
function assessment_contacts(array $state): array {
    $out=[];
    foreach(assessment_contact_defaults()as $id=>$defaults){
        $saved=$state['assessmentContacts'][$id]??[];
        $contact=['id'=>$id,'version'=>'initial','display'=>'full']+$defaults;
        $contact=array_merge($contact,$defaults,array_intersect_key($saved,array_flip(['name','contactUrl','version'])));
        if (!empty($saved['file'])) { $contact['src']='api/join.php?action=assessment-contact-image&id='.$id.'&v='.$saved['version'];$contact['display']='full'; }
        $out[$id]=$contact;
    }
    return $out;
}
function assessment_contact_save(): never {
    $id=field('id');$name=field('name');$contactUrl=field('contactUrl');$version=field('version');
    if (!isset(assessment_contact_defaults()[$id])) fail('二维码条目不存在');
    if ($name===''||strlen($name)>90||preg_match('/[\x00-\x1f]/',$name)) fail('名称需填写，最多30个汉字');
    if ($contactUrl!==''&&(strlen($contactUrl)>1500||!filter_var($contactUrl,FILTER_VALIDATE_URL)||parse_url($contactUrl,PHP_URL_SCHEME)!=='https'||preg_match('/[\x00-\x20]/',$contactUrl))) fail('添加链接需为有效的HTTPS网址，不填写则仅保留扫码');
    $uploaded=assessment_upload(true);
    try {
        $result=join_update(function(array &$s)use($id,$name,$contactUrl,$version,$uploaded){
            if (!authenticated($s)) return 'auth';
            $old=$s['assessmentContacts'][$id]??[];
            if (!hash_equals($old['version']??'initial',$version)) return 'conflict';
            $s['assessmentContacts'][$id]=['name'=>$name,'contactUrl'=>$contactUrl,'version'=>bin2hex(random_bytes(12)),'file'=>$uploaded??($old['file']??''),'updatedAt'=>date(DATE_ATOM)];
            join_audit($s,'更新联系二维码：'.$name);
            return ['contacts'=>assessment_contacts($s),'oldFile'=>$uploaded?($old['file']??null):null];
        });
    }catch(Throwable $e){assessment_remove_image($uploaded);throw $e;}
    if(is_string($result)){assessment_remove_image($uploaded);fail($result==='auth'?'登录已失效':'该二维码已被其他管理员更新，请刷新后再保存',$result==='auth'?401:409);}
    assessment_remove_image($result['oldFile']);reply(['ok'=>true,'contacts'=>$result['contacts']]);
}
