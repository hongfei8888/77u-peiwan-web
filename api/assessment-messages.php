<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }

function assessment_message_viewer(array $state): ?array {
    $a=identity($state);
    if (!$a) return null;
    return ['name'=>$state['community']['profiles'][$a['id']]['nickname']??$a['username'],'role'=>$a['role'],
        'canPost'=>true,'mustChangePassword'=>false];
}
function assessment_message_public(array $item): array {
    if (!empty($item['anonymous'])) { $item['author']='匿名陪玩';$item['official']=false;$item['companion']=false; }
    return array_intersect_key($item,array_flip(['id','author','content','createdAt','official','companion','anonymous']));
}
function assessment_message_list(array $state): never {
    $manage=($_GET['manage']??'')==='1';
    if ($manage) require_user($state,true);
    $page=$_GET['page']??'1';
    if (!is_string($page)||!preg_match('/^[1-9][0-9]{0,5}$/D',$page)) throw new InvalidArgumentException('页码无效');
    $q=textval($_GET['q']??'',240);
    if (!preg_match('//u',$q)||preg_match_all('/./us',$q)>60) throw new InvalidArgumentException('搜索最多60字');
    $all=array_map('assessment_message_public',array_values($state['assessmentMessages']??[]));
    $items=array_values(array_filter($all,fn($m)=>$q===''||stripos($m['author'].' '.$m['content'],$q)!==false));
    $limit=$manage?20:5;$total=count($items);$pages=max(1,(int)ceil($total/$limit));$current=min((int)$page,$pages);
    out(['items'=>array_map('assessment_message_public',array_slice($items,($current-1)*$limit,$limit)),
        'total'=>$total,'page'=>$current,'pages'=>$pages,'viewer'=>assessment_message_viewer($state),'csrf'=>$_SESSION['csrf']]);
}
function assessment_message_manage(string $action,array $data): never {
    $deleting=$action==='assessment-message-delete';
    $id=textval($data[$deleting?'id':'requestId']??'',24);
    if (!preg_match('/^[a-f0-9]{24}$/D',$id)) throw new InvalidArgumentException('留言标识无效，请刷新重试');
    $content='';$author='';$anonymous=false;
    if (!$deleting) {
        $anonymous=$data['anonymous']??false;
        if (!is_bool($anonymous)) throw new InvalidArgumentException('匿名选项无效');
        $author=$anonymous?'匿名陪玩':textval($data['author']??'',120);
        if (!preg_match('//u',$author)||preg_match('/[\x00-\x1f\x7f]/',$author)||preg_match_all('/./us',$author)>30||
            preg_replace('/[\s\p{Z}\x{200b}\x{feff}]+/u','',$author)==='') throw new InvalidArgumentException('请填写名字或编号，最多30字；也可以选择匿名留言');
        $content=str_replace(["\r\n","\r"],"\n",textval($data['content']??'',2000));
        if (!preg_match('//u',$content)||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/',$content)||
            preg_match_all('/./us',$content)>500||preg_replace('/[\s\p{Z}\x{200b}\x{feff}]+/u','',$content)==='')
            throw new InvalidArgumentException('请填写1–500字的留言');
    }
    if (!$deleting) $_SESSION['assessmentMessageGuest']??=bin2hex(random_bytes(16));
    $visitor=$deleting?'':hash('sha256',$_SESSION['assessmentMessageGuest']);
    $network=$deleting?'':hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');
    $result=join_update(function(array &$state)use($deleting,$id,$content,$author,$anonymous,$visitor,$network){
        if ($deleting) {
            $actor=require_user($state,true);
            if (!isset($state['assessmentMessages'][$id])) throw new DomainException('留言已删除，请刷新列表',404);
            unset($state['assessmentMessages'][$id]);
            join_audit($state,'删除考核页留言',$id,$actor['username']);
            audit($state['community'],$actor,'assessment-message-delete',$id);
            return ['ok'=>true];
        }
        // Retrying a request after an uncertain network response never duplicates it.
        foreach($state['assessmentMessages']??[]as $old)
            if (($old['requestId']??'')===$id&&($old['visitorKey']??'')===$visitor) return ['ok'=>true,'item'=>assessment_message_public($old)];
        $now=time();$rates=$state['assessmentMessageGuestRates']??[];$browserKey='browser:'.$visitor;$networkKey='network:'.$network;
        $last=$rates[$browserKey]['last']??0;
        if ($now-$last<30) throw new DomainException('留言发布较频繁，请30秒后再试',429);
        $net=$rates[$networkKey]??['count'=>0,'until'=>$now+600];
        if ($net['until']<=$now) $net=['count'=>0,'until'=>$now+600];
        if ($net['count']>=30) throw new DomainException('当前网络留言较频繁，请稍后再试',429);
        if (count($state['assessmentMessages']??[])>=5000) throw new DomainException('留言板已满，请联系管理员清理后再发布',409);
        $record=['id'=>bin2hex(random_bytes(12)),'visitorKey'=>$visitor,'requestId'=>$id,
            'author'=>$author,'anonymous'=>$anonymous,'content'=>$content,'createdAt'=>date(DATE_ATOM),'official'=>false,'companion'=>false];
        $state['assessmentMessages']=[$record['id']=>$record]+($state['assessmentMessages']??[]);
        $state['assessmentMessageGuestRates']=array_filter($rates,fn($entry)=>$entry['until']>$now);
        $state['assessmentMessageGuestRates'][$browserKey]=['last'=>$now,'until'=>$now+86400];
        $state['assessmentMessageGuestRates'][$networkKey]=['count'=>$net['count']+1,'until'=>$net['until']];
        return ['ok'=>true,'item'=>assessment_message_public($record)];
    });
    out($result);
}
