<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }

// Separate assessment notices/contacts from the public website's groups and announcements.
function assessment_notices(array $state): array {
    $items=array_values($state['assessmentNotices']??[]);
    usort($items,fn($a,$b)=>strcmp($b['createdAt'],$a['createdAt']));
    return array_map(function($a) {
        unset($a['file']);
        return $a;
    },array_map(function($a) {
        $a['image']=empty($a['file'])?'':'api/join.php?action=assessment-notice-image&id='.$a['id'].'&v='.$a['version'];
        return $a;
    },$items));
}
function assessment_examiner_tags(): array { return ['端游','手游','质检','颜值','声优']; }
function assessment_examiners(array $state,bool $editor=false): array {
    $items=array_values($state['assessmentExaminers']??[]);
    usort($items,fn($a,$b)=>($a['order']<=>$b['order'])?:strcmp($a['createdAt'],$b['createdAt'])?:strcmp($a['id'],$b['id']));
    $out=[];
    foreach($items as $a) {
        if (!$editor && (!$a['enabled'] || empty($a['file']))) continue;
        $savedTags=is_array($a['tags']??null)?$a['tags']:[];
        $a['tags']=array_values(array_filter(assessment_examiner_tags(),fn($tag)=>in_array($tag,$savedTags,true)));
        $a['src']=empty($a['file'])?'':'api/join.php?action=assessment-examiner-image&id='.$a['id'].'&v='.$a['version'];
        unset($a['file']);$out[]=$a;
    }
    return $out;
}
function assessment_image(string $kind,array $state): never {
    $id=is_string($_GET['id']??null)?$_GET['id']:'';
    $file=$state[$kind][$id]['file']??'';
    if (!$file || !preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/D',$file)) fail('图片不存在',404);
    $path=join_dir().'/assessment-images/'.$file;
    if (!is_file($path)) fail('图片不存在',404);
    $ext=pathinfo($file,PATHINFO_EXTENSION);
    header('Content-Type: '.['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'][$ext]);
    header('Content-Disposition: inline; filename="assessment.'.$ext.'"');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    readfile($path);exit;
}
function assessment_upload(bool $qr): ?string {
    if (!isset($_FILES['image']) || $_FILES['image']['error']===UPLOAD_ERR_NO_FILE) return null;
    $f=$_FILES['image'];
    if ($f['error']!==UPLOAD_ERR_OK || $f['size']>4*1024*1024 || $f['size']<1 || !is_uploaded_file($f['tmp_name'])) fail('请选择4MB以内的图片');
    $info=@getimagesize($f['tmp_name']);$mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $formats=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];$min=$qr?100:1;$max=$qr?4096:8192;
    if (!$info || !isset($formats[$mime]) || $info['mime']!==$mime || $info[0]<$min || $info[1]<$min || $info[0]>$max || $info[1]>$max) fail($qr?'二维码需为100–4096像素的PNG、JPG或WebP图片':'通知图片需为8192像素以内的PNG、JPG或WebP图片');
    $dir=join_dir().'/assessment-images';
    if (!is_dir($dir) && !mkdir($dir,0700,true)) throw new RuntimeException('创建考核图片目录失败');
    $file=bin2hex(random_bytes(16)).'.'.$formats[$mime];
    if (!move_uploaded_file($f['tmp_name'],$dir.'/'.$file)) throw new RuntimeException('考核图片保存失败');
    @chmod($dir.'/'.$file,0600);return $file;
}
function assessment_remove_image(?string $file): void {
    if ($file && preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/D',$file)) @unlink(join_dir().'/assessment-images/'.$file);
}
function assessment_manage(string $action): void {
    $notice=str_starts_with($action,'assessment-notice-');
    $key=$notice?'assessmentNotices':'assessmentExaminers';
    $id=field('id');$version=field('version');$deleting=str_ends_with($action,'-delete');
    $isNew=$id==='';
    if ($deleting && $isNew) fail('请选择要删除的条目');
    if (!$isNew && !preg_match('/^[a-f0-9]{24}$/D',$id)) fail('条目编号无效');
    if ($isNew) $id=bin2hex(random_bytes(12));
    $item=[];$uploaded=null;
    if (!$deleting) {
        if ($notice) {
            $title=field('title');$text=field('text');
            if ($title==='' || strlen($title)>180 || strlen($text)>15000 || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$title.$text)) fail('请填写标题（最多60个汉字），正文最多5000个汉字');
            $item=['title'=>$title,'text'=>$text];
        } else {
            $name=field('name');$description=field('description');$order=field('order');
            if ($name==='' || strlen($name)>90 || strlen($description)>360 || preg_match('/[\x00-\x1f]/',$name.$description)) fail('考官名称最多30个汉字，简介最多120个汉字');
            if (!preg_match('/^[0-9]{1,4}$/D',$order) || (int)$order>9999) fail('排序请填写0–9999的整数');
            if (!in_array(field('enabled'),['0','1'],true)) fail('请选择是否展示');
            try { $tags=json_decode(field('tags'),true,8,JSON_THROW_ON_ERROR); }
            catch(Throwable $e) { fail('请选择考官标签'); }
            if (!is_array($tags)||!array_is_list($tags)||count($tags)<1||count($tags)>5) fail('请至少选择一个考官标签，最多五个');
            foreach($tags as $tag) if (!is_string($tag)||!in_array($tag,assessment_examiner_tags(),true)) fail('考官标签只能选择端游、手游、质检、颜值、声优');
            $tags=array_values(array_filter(assessment_examiner_tags(),fn($tag)=>in_array($tag,$tags,true)));
            $item=['name'=>$name,'description'=>$description,'tags'=>$tags,'order'=>(int)$order,'enabled'=>field('enabled')==='1'];
        }
        $uploaded=assessment_upload(!$notice);
    }
    try {
        $result=join_update(function(array &$s) use($key,$notice,$id,$version,$deleting,$isNew,$item,$uploaded) {
            if (!authenticated($s)) return 'auth';
            $old=$s[$key][$id]??null;
            if (!$isNew && !$old) return 'missing';
            if ($old && !hash_equals($old['version'],$version)) return 'conflict';
            if ($isNew && count($s[$key]??[])>=($notice?100:60)) return 'limit';
            if ($deleting) {
                unset($s[$key][$id]);
                join_audit($s,($notice?'删除重要通知：':'删除考官：').($old['title']??$old['name']));
            } else {
                $file=$uploaded??($old['file']??'');
                if ($notice && $item['text']==='' && !$file) return 'empty';
                if (!$notice && !$file) return 'image';
                $s[$key][$id]=array_merge($item,['id'=>$id,'file'=>$file,'version'=>bin2hex(random_bytes(12)),'createdAt'=>$old['createdAt']??date(DATE_ATOM),'updatedAt'=>date(DATE_ATOM)]);
                // Newest notices stay first even when several are published in the same second.
                if ($isNew) $s[$key]=[$id=>$s[$key][$id]]+$s[$key];
                join_audit($s,($notice?'保存重要通知：':'保存考官二维码：').($item['title']??$item['name']));
            }
            return ['items'=>$notice?assessment_notices($s):assessment_examiners($s,true),'removedFile'=>($deleting||$uploaded)?($old['file']??null):null];
        });
    } catch(Throwable $e) { assessment_remove_image($uploaded);throw $e; }
    if (is_string($result)) {
        assessment_remove_image($uploaded);
        $errors=['auth'=>['登录已失效',401],'missing'=>['条目已被删除，请刷新列表',404],'conflict'=>['其他管理员已修改此条目，请刷新后再保存',409],'limit'=>[$notice?'最多保留100条通知，请先删除过期通知':'最多支持60位考官',409],'empty'=>['请填写通知正文或上传图片',400],'image'=>['请上传考官二维码',400]];
        fail(...$errors[$result]);
    }
    assessment_remove_image($result['removedFile']);
    reply(['ok'=>true,$notice?'notices':'examiners'=>$result['items']]);
}
