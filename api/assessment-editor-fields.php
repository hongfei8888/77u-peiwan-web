<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }

// Operating content only. Navigation, section names, headings, level names and
// step numbers remain part of the fixed page structure.
$fields=[];
$add=static function(string $key,string $group,string $block,string $label,string $editor='textarea',string $row='',string $column='') use (&$fields): void {
    $fields[$key]=['group'=>$group,'block'=>$block,'label'=>$label,'editor'=>$editor,'row'=>$row,'column'=>$column];
};
foreach (['pc'=>'端游考核','mobile'=>'手游考核'] as $prefix=>$group) {
    foreach ([['单考标准',3,8,20],['双考标准',21,26,38]] as $config) {
        [$block,$caption,$first,$note]=$config;
        $add("$prefix.$caption",$group,$block,'考核方式与局数');
        foreach (['PRO','顶尖','魔王'] as $i=>$level) {
            foreach (['累计击杀','物资价值','装备要求'] as $j=>$column) {
                $add($prefix.'.'.($first+$i*4+$j+1),$group,$block,"$level · $column",'text',$level,$column);
            }
        }
        $add("$prefix.$note",$group,$block,'撤离要求与考核限制');
    }
    foreach ([39=>'考核方式',41=>'小S要求',43=>'大S要求'] as $n=>$label) $add("$prefix.$n",$group,'娱乐考核',$label);
    foreach ([45=>'考核费用',46=>'文考与其他费用',47=>'保证金说明'] as $n=>$label) $add("$prefix.$n",$group,'费用与保证金',$label,'text');
    foreach (['fun'=>'娱乐','pro'=>'PRO','top'=>'顶尖','demon'=>'魔王'] as $key=>$level) $add("$prefix.deposit.$key",$group,'费用与保证金',"$level 保证金",'text');
    $add("$prefix.49",$group,'报名要求','账号、设备与报名条件');
    $add("$prefix.51",$group,'报名要求','考前准备说明');
}
$group='质检标准';
foreach (['single'=>'单考质检','double'=>'双陪质检'] as $mode=>$block) {
    $block='优先派单群 · '.$block;
    $add("quality.priority.$mode.caption",$group,$block,'考核方式与局数');
    foreach (['PRO','顶尖','魔王'] as $i=>$level) $add("quality.priority.$mode.count.$i",$group,$block,"$level · 总击杀",'text',$level,'总击杀');
}
$add('quality.priority.intro',$group,'优先派单群 · 说明与限制','通过质检后的安排');
$add('quality.priority.double.extraction',$group,'优先派单群 · 说明与限制','撤离物资与人头差要求');
$add('quality.priority.double.maps',$group,'优先派单群 · 说明与限制','不同地图的人头计算');
foreach (['void'=>['流局处理',3],'limits'=>['考核限制',1],'notes'=>['注意事项',9],'process'=>['质检流程',8]] as $prefix=>$config) {
    for ($i=0;$i<$config[1];$i++) $add("quality.priority.$prefix.$i",$group,'优先派单群 · '.$config[0],$config[0].' '.($i+1));
}
$add('page.text.84',$group,'售后质检 · 考核标准','售后质检处理说明');
foreach ([87=>['单陪质检','考核方式与局数'],96=>['双陪质检','考核方式与局数']] as $n=>$meta) $add("page.text.$n",$group,'售后质检 · '.$meta[0],$meta[1]);
foreach ([91=>['单陪质检','PRO'],93=>['单陪质检','顶尖'],95=>['单陪质检','魔王'],100=>['双陪质检','PRO'],102=>['双陪质检','顶尖'],104=>['双陪质检','魔王']] as $n=>$meta) $add("page.text.$n",$group,'售后质检 · '.$meta[0],$meta[1].' · 两局总击杀','text',$meta[1],'两局总击杀');
for ($i=106;$i<=110;$i++) $add("page.text.$i",$group,'售后质检 · 流程与要求','流程 '.($i-105));
$add('page.text.112',$group,'售后质检 · 流程与要求','装备与考核限制');
foreach ([129=>'照片、视频与本人验证',130=>'出镜要求',131=>'S颜值认证要求'] as $n=>$label) $add("page.text.$n",'颜值与声优','颜值陪考核',$label);
foreach ([140=>'声线鉴定方式',141=>'女陪声线范围',142=>'男陪声线范围',143=>'试音条要求',144=>'歌手认证要求'] as $n=>$label) $add("page.text.$n",'颜值与声优','声优陪与歌手考核',$label);
foreach ([3=>'报名动作',4=>'联系安排',6=>'缴费动作',7=>'考核群安排',9=>'参加考核',10=>'考核依据',12=>'入店动作',13=>'通过后安排',14=>'完整入店流程',15=>'文考期限与逾期处理'] as $n=>$label) $add("process.$n",'流程与须知','报名与入店流程',$label);
$add('notices.3','流程与须知','考前注意事项','考前准备提示');
for ($i=4;$i<=11;$i++) $add("notices.$i",'流程与须知','考前注意事项','注意事项 '.($i-3));
foreach ([2=>'开播与公开考核说明',4=>'官方收款说明',6=>'违规举报处理说明'] as $n=>$label) $add("supervision.$n",'流程与须知','监督与收款说明',$label);
foreach ([4=>'页面开场介绍',10=>'服务范围说明',25=>'考核公示说明',30=>'端游文档说明',32=>'手游文档说明',36=>'价格表说明',38=>'店规文档说明',40=>'接单流程说明',42=>'客服联系方式说明',44=>'报单教学说明',46=>'负责人联系表说明',48=>'学员系统说明',50=>'添加客服提醒',154=>'报名入群说明',155=>'群二维码提示',158=>'联系考官说明',159=>'考官二维码提示',163=>'留言板使用说明'] as $n=>$label) $add("page.text.$n",'展示文案','页面说明文字',$label);
$add('quality.public.description','展示文案','页面说明文字','质检名单展示说明');
foreach ([1=>'端游考核标准',2=>'手游考核标准',3=>'价格表',4=>'柒柒游电竞店规',5=>'三角洲接单流程',6=>'客服好友码',7=>'报单与跳单教学',8=>'负责人联系表',9=>'学员注册登录',10=>'质检标准原文',11=>'颜值陪与声优陪原文'] as $n=>$label) $add("page.link.$n",'资料链接','在线资料地址',$label,'url');
return $fields;
