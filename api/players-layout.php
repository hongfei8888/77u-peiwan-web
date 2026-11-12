<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }

function players_defaults(array $c): array {
    $labels=['all'=>'全部陪玩','ge'=>'柒哥严选','yue'=>'月姐推荐','community'=>'社区新成员','singer'=>'歌手','voice'=>'声优','technical'=>'技术大神','appearance'=>'颜值','demon'=>'魔王'];
    $map=['歌手'=>'singer','声优'=>'voice','技术大神'=>'technical','颜值'=>'appearance','魔王'=>'demon'];
    $categories=[];
    foreach($labels as $key=>$title)$categories[$key]=['title'=>$title,'enabled'=>true,'members'=>[]];
    foreach($c['profiles'] as $id=>$p){
        if(!public_profile($c,$id))continue;
        $groups=empty($p['categories'])?($p['seedCard']['groups']??[]):array_values(array_intersect_key($map,array_flip($p['categories'])));
        $groups=array_unique(array_merge(array_values(array_intersect($p['seedCard']['groups']??[],['ge','yue'])),['all'],isset($p['seedCard'])?[]:['community'],$groups));
        foreach($groups as $key)if(isset($categories[$key]))$categories[$key]['members'][]=$id;
    }
    $hero=[];
    foreach(['小透明','早晚','PA'] as $name){$id='';foreach($c['profiles'] as $key=>$p)if(public_profile($c,$key)&&($p['seedCard']['name']??$p['nickname'])===$name){$id=$key;break;}$hero[]=$id;}
    return ['version'=>'initial','defaultFilter'=>'ge','hiddenIds'=>[],'hero'=>$hero,
        'copy'=>['title'=>"找到合拍的\n游戏搭子",'lead'=>'先看公开标签、声音与视频，再选择想认识的人。所有咨询由客服统一承接。','discoveryTitle'=>'先从严选推荐开始','discoveryLead'=>'根据资料完整度与公开能力标签整理','ctaTitle'=>"把你的偏好告诉客服，\n我们来帮你匹配。",'ctaLead'=>'还没找到合适的？'],
        'sections'=>array_map(fn($id)=>['id'=>$id,'enabled'=>true],['announcements','hero','discovery','roster','cta']),
        'categoryOrder'=>array_keys($labels),'categories'=>$categories];
}
function players_layout(array $c): array { return $c['playersLayout']??players_defaults($c); }
function players_save(array &$c,array $d): void {
    $current=players_layout($c);
    if(($d['version']??null)!==$current['version'])throw new DomainException('其他管理员已更新陪玩社区，请重新载入后再修改。当前修改仍保留在页面中。',409);
    $p=$d['layout']??null;if(!is_array($p))throw new InvalidArgumentException('展示配置无效');
    $defaults=players_defaults($c);$keys=array_keys($defaults['categories']);
    if(!is_array($p['copy']??null)||!is_array($p['categories']??null))throw new InvalidArgumentException('页面文案或分类无效');
    $ids=function(mixed $value,int $max=5000)use($c):array{
        if(!is_array($value)||!array_is_list($value)||count($value)>$max)throw new InvalidArgumentException('陪玩名单无效');
        $out=[];foreach($value as $id){if(!is_string($id)||!isset($c['accounts'][$id],$c['profiles'][$id])||in_array($id,$out,true))throw new InvalidArgumentException('陪玩不存在或在同一位置重复');$out[]=$id;}return $out;
    };
    $next=['hiddenIds'=>$ids($p['hiddenIds']??null),'copy'=>[],'categories'=>[]];
    $hero=$p['hero']??null;
    if(!is_array($hero)||!array_is_list($hero)||count($hero)!==3)throw new InvalidArgumentException('首屏需要三个位置');
    foreach($hero as $id)if(!is_string($id))throw new InvalidArgumentException('首屏陪玩标识无效');
    $ids(array_values(array_filter($hero,fn($id)=>$id!=='')),3);$next['hero']=$hero;
    foreach($defaults['copy'] as $key=>$value){$next['copy'][$key]=textval($p['copy'][$key]??null,1200);if($next['copy'][$key]==='')throw new InvalidArgumentException('页面文案不能为空');}
    $sections=$p['sections']??null;$sectionKeys=array_column($defaults['sections'],'id');
    if(!is_array($sections)||!array_is_list($sections)||count($sections)!==count($sectionKeys))throw new InvalidArgumentException('页面板块配置无效');
    $seen=[];$next['sections']=[];foreach($sections as $section){if(!is_array($section))throw new InvalidArgumentException('页面板块配置无效');$id=$section['id']??null;if(!in_array($id,$sectionKeys,true)||in_array($id,$seen,true)||!is_bool($section['enabled']??null))throw new InvalidArgumentException('页面板块重复或无效');$seen[]=$id;$next['sections'][]=['id'=>$id,'enabled'=>$section['enabled']];}
    $order=$p['categoryOrder']??null;
    if(!is_array($order)||!array_is_list($order)||count($order)!==count($keys)||count(array_filter($order,'is_string'))!==count($keys)||count(array_unique($order,SORT_REGULAR))!==count($keys)||array_diff($keys,$order))throw new InvalidArgumentException('分类顺序无效');
    $next['categoryOrder']=$order;
    foreach($keys as $key){$category=$p['categories'][$key]??null;if(!is_array($category)||!is_bool($category['enabled']??null))throw new InvalidArgumentException('分类设置无效');$title=textval($category['title']??null,120);if($title==='')throw new InvalidArgumentException('分类名称不能为空');$next['categories'][$key]=['title'=>$title,'enabled'=>$category['enabled'],'members'=>$ids($category['members']??null)];}
    // The all category always includes eligible newcomers; its explicit list sets priority.
    $filter=$p['defaultFilter']??null;if(!is_string($filter)||!isset($next['categories'][$filter])||!$next['categories'][$filter]['enabled'])throw new InvalidArgumentException('默认分类必须处于显示状态');
    $next['defaultFilter']=$filter;$next['version']=bin2hex(random_bytes(16));$next['updatedAt']=nowstamp();$c['playersLayout']=$next;
}
