<?php
declare(strict_types=1);
define('JOIN_ENTRY',true);
require __DIR__.'/join-lib.php';
ini_set('display_errors','0');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
function reply(array $data,int $status=200): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
function fail(string $message,int $code=400): never { reply(['error'=>$message],$code); }
function field(string $name): string { $v=$_POST[$name]??''; return is_string($v)?trim($v):''; }
function authenticated(array $state): bool {
    $admin=$state['admins'][$_SESSION['username']??'']??null;
    return $admin && isset($_SESSION['admin'],$_SESSION['expires']) && $_SESSION['expires']>time() && hash_equals($admin['generation'],$_SESSION['admin']);
}
require __DIR__.'/assessment-lib.php';
require __DIR__.'/assessment-quality.php';
try {
    $action=is_string($_GET['action']??null)?$_GET['action']:'groups';
    $state=join_read();
    if ($action==='assessment' && $_SERVER['REQUEST_METHOD']==='GET') reply(['content'=>join_content($state),'notices'=>assessment_notices($state),'examiners'=>assessment_examiners($state),'quality'=>assessment_quality_summary($state),'contacts'=>assessment_contacts($state)]);
    if ($action==='assessment-quality-list' && $_SERVER['REQUEST_METHOD']==='GET') assessment_quality_list($state);
    if ($action==='contact-codes' && $_SERVER['REQUEST_METHOD']==='GET') reply(['contacts'=>assessment_contacts($state)]);
    if ($action==='assessment-contact-image' && $_SERVER['REQUEST_METHOD']==='GET') assessment_image('assessmentContacts',$state);
    if ($action==='assessment-notice-image' && $_SERVER['REQUEST_METHOD']==='GET') assessment_image('assessmentNotices',$state);
    if ($action==='assessment-examiner-image' && $_SERVER['REQUEST_METHOD']==='GET') assessment_image('assessmentExaminers',$state);
    if ($action==='groups' && $_SERVER['REQUEST_METHOD']==='GET') reply(['groups'=>join_groups($state),'announcements'=>join_announcements($state),'today'=>date('Y-m-d')]);
    if ($action==='announcement-image' && $_SERVER['REQUEST_METHOD']==='GET') {
        $id=is_string($_GET['id']??null)?$_GET['id']:'';
        $file=$state['joinAnnouncements'][$id]['file']??'';
        if (!$file || !preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/D',$file)) fail('公告图片不存在',404);
        $path=join_dir().'/announcement-images/'.$file;
        if (!is_file($path)) fail('公告图片不存在',404);
        $types=['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'];
        header('Content-Type: '.$types[pathinfo($file,PATHINFO_EXTENSION)]);
        header('Content-Disposition: inline; filename="announcement.'.pathinfo($file,PATHINFO_EXTENSION).'"');
        header('Content-Security-Policy: default-src \'none\'; sandbox');
        readfile($path);exit;
    }
    if ($action==='image' && $_SERVER['REQUEST_METHOD']==='GET') {
        $id=is_string($_GET['id']??null)?$_GET['id']:'';
        $group=$state['groups'][$id]??null;
        if (!$group) fail('二维码不可用',404);
        $file=$group['file'];
        if (!$file || !preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/D',$file)) fail('图片不存在',404);
        $path=join_dir().'/images/'.$file;
        if (!is_file($path)) fail('图片不存在',404);
        $types=['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'];
        header('Content-Type: '.$types[pathinfo($file,PATHINFO_EXTENSION)]);
        header('Content-Disposition: inline; filename="group-qr.'.pathinfo($file,PATHINFO_EXTENSION).'"');
        header('Content-Security-Policy: default-src \'none\'; sandbox');
        readfile($path); exit;
    }
    $secure=(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS']!=='off');
    if (!$secure && !in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true)) fail('管理后台请使用 HTTPS 访问',403);
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    session_name('qiqiyou_join_admin');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32));
    if ($action==='session' && $_SERVER['REQUEST_METHOD']==='GET') reply(['configured'=>(bool)$state['admins'],'authenticated'=>authenticated($state),'username'=>authenticated($state)?$_SESSION['username']:null,'csrf'=>$_SESSION['csrf'],'groups'=>authenticated($state)?join_groups($state):null,'announcements'=>authenticated($state)?join_announcements($state):null,'audit'=>authenticated($state)?array_slice($state['audit'],0,10):null]);
    if ($action==='assessment-editor' && $_SERVER['REQUEST_METHOD']==='GET') { if (!authenticated($state)) fail('需要管理员登录',401); reply(['content'=>join_content($state),'template'=>join_editor_template(),'notices'=>assessment_notices($state),'examiners'=>assessment_examiners($state,true),'qualityRecords'=>assessment_quality_records($state),'contacts'=>assessment_contacts($state)]); }
    if ($_SERVER['REQUEST_METHOD']!=='POST') fail('请求方式不支持',405);
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) fail('页面已失效，请刷新后重试',403);
    if (!$state['admins']) fail('请先在宝塔终端初始化二维码管理员',503);
    if ($action==='login') {
        $username=field('username'); $password=$_POST['password']??'';
        if (!is_string($password) || strlen($password)>72 || strlen($username)>32) fail('账号或密码错误',401);
        $result=join_update(function(array &$s) use($username,$password) { return join_login_check($s,$username,$password); });
        if ($result===false) fail('登录尝试过多，请15分钟后重试',429);
        if ($result===null) fail('账号或密码错误',401);
        session_regenerate_id(true); $_SESSION['username']=$result['username']; $_SESSION['admin']=$result['generation']; $_SESSION['expires']=time()+7200; $_SESSION['csrf']=bin2hex(random_bytes(32));
        reply(['ok'=>true]);
    }
    if (!authenticated($state)) fail('登录已过期，请重新登录',401);
    if ($action==='logout') { $_SESSION=[]; session_destroy(); setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']); reply(['ok'=>true]); }
    if (in_array($action,['assessment-notice-save','assessment-notice-delete','assessment-examiner-save','assessment-examiner-delete'],true)) assessment_manage($action);
    if (in_array($action,['assessment-quality-save','assessment-quality-delete'],true)) assessment_quality_manage($action);
    if ($action==='assessment-contact-save') assessment_contact_save();
    if ($action==='password') {
        $old=$_POST['oldPassword']??''; $next=$_POST['newPassword']??'';
        if (!is_string($old) || !is_string($next) || !join_password($next)) fail('新密码需12–72字节，包含字母和数字');
        $changed=join_update(function(array &$s) use($old,$next) {
            $username=$_SESSION['username'];
            $admin=$s['admins'][$username]??null;
            if (!$admin || !hash_equals($admin['generation'],$_SESSION['admin']) || !password_verify($old,$admin['hash'])) return false;
            $s['admins'][$username]['hash']=password_hash($next,PASSWORD_DEFAULT); $s['admins'][$username]['generation']=bin2hex(random_bytes(16)); join_audit($s,'修改管理员密码'); return true;
        });
        if (!$changed) fail('当前密码不正确',403);
        $_SESSION=[]; session_destroy(); reply(['ok'=>true]);
    }
    if ($action==='announcement-create') {
        $title=field('title');$text=field('text');
        if (strlen($title)>180 || strlen($text)>15000 || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$title.$text)) fail('标题最多60个汉字，正文最多5000个汉字');
        $uploaded=null;
        if (isset($_FILES['image']) && $_FILES['image']['error']!==UPLOAD_ERR_NO_FILE) {
            $f=$_FILES['image'];
            if (!is_int($f['error']) || $f['error']!==UPLOAD_ERR_OK || $f['size']>4*1024*1024 || $f['size']<1 || !is_uploaded_file($f['tmp_name'])) fail('请选择4MB以内的公告图片');
            $info=@getimagesize($f['tmp_name']);$mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
            $formats=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];
            if (!$info || !isset($formats[$mime]) || $info['mime']!==$mime || $info[0]<1 || $info[1]<1 || $info[0]>8192 || $info[1]>8192) fail('仅支持8192像素以内的PNG、JPG、WebP公告图片');
            $dir=join_dir().'/announcement-images';
            if (!is_dir($dir) && !mkdir($dir,0700,true)) throw new RuntimeException('公告图片目录不可写');
            $uploaded=bin2hex(random_bytes(16)).'.'.$formats[$mime];
            if (!move_uploaded_file($f['tmp_name'],$dir.'/'.$uploaded)) throw new RuntimeException('公告图片保存失败');
            @chmod($dir.'/'.$uploaded,0600);
        }
        if ($text==='' && !$uploaded) fail('请填写公告正文或上传图片');
        $id=bin2hex(random_bytes(12));
        try {
            $result=join_update(function(array &$s) use($id,$title,$text,$uploaded) {
                if (!authenticated($s)) return 'auth';
                $a=['id'=>$id,'title'=>$title?:'公告通知','text'=>$text,'file'=>$uploaded??'','createdAt'=>date(DATE_ATOM)];
                $s['joinAnnouncements']=[$id=>$a]+($s['joinAnnouncements']??[]);
                join_audit($s,'发布招募公告：'.$a['title']);
                return join_announcements($s);
            });
        } catch(Throwable $e) { if($uploaded) @unlink(join_dir().'/announcement-images/'.$uploaded);throw $e; }
        if (is_string($result)) { if($uploaded) @unlink(join_dir().'/announcement-images/'.$uploaded);fail('登录已失效',401); }
        reply(['ok'=>true,'announcements'=>$result]);
    }
    if ($action==='announcement-delete') {
        $id=field('id');
        $result=join_update(function(array &$s) use($id) {
            if (!authenticated($s)) return 'auth';
            $a=$s['joinAnnouncements'][$id]??null;
            if (!$a) return 'missing';
            unset($s['joinAnnouncements'][$id]);join_audit($s,'删除招募公告：'.$a['title']);
            return ['announcements'=>join_announcements($s),'file'=>$a['file']];
        });
        if (is_string($result)) fail($result==='auth'?'登录已失效':'公告已被删除，请刷新列表',$result==='auth'?401:404);
        if (!empty($result['file']) && preg_match('/^[a-f0-9]{32}\.(png|jpg|webp)$/D',$result['file'])) @unlink(join_dir().'/announcement-images/'.$result['file']);
        reply(['ok'=>true,'announcements'=>$result['announcements']]);
    }
    if ($action==='content-save') {
        try { $values=json_decode(field('values'),true,512,JSON_THROW_ON_ERROR); } catch(Throwable $e) { fail('考核内容格式不正确'); }
        $template=array_column(join_editor_template(),null,'key');
        if (!is_array($values) || !$values || count($values)>count($template)) fail('请提交需要修改的考核内容；如管理页未更新，请刷新重试');
        foreach($values as $key=>$value) {
            if (!isset($template[$key])) fail('页面框架已固定，仅可修改考核数据、方式、说明与资料链接，请刷新管理页');
            $item=$template[$key];
            if (!is_string($value) || trim($value)==='' || strlen($value)>6000 || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$value)) fail('请填写有效的考核文案，每项最多2000个汉字');
            if (($item['kind']??'text')==='url') {
                $parts=parse_url(trim($value));
                if (!filter_var(trim($value),FILTER_VALIDATE_URL) || !$parts || !in_array(strtolower($parts['scheme']??''),['http','https'],true) || isset($parts['user']) || isset($parts['pass'])) fail('资料链接必须为有效的 HTTP 或 HTTPS 地址');
            }
            $values[$key]=trim($value);
        }
        $version=field('version');
        $result=join_update(function(array &$s) use($values,$version) {
            if (!authenticated($s)) return 'auth';
            if (!hash_equals(join_content($s)['version'],$version)) return 'conflict';
            $saved=$s['joinContent']??[];
            $merged=array_replace($saved['values']??[],join_content($s)['values'],$values);
            $s['joinContent']=array_replace($saved,['values'=>$merged,'version'=>bin2hex(random_bytes(12)),'updatedAt'=>date(DATE_ATOM)]);
            $s['migrations']['pc-pro-500-20261017']=true;
            join_audit($s,'修改考核文案、数据与装备');
            return join_content($s);
        });
        if (is_string($result)) fail($result==='auth'?'登录已失效':'考核内容已被其他管理员更新，请刷新后再保存',$result==='auth'?401:409);
        reply(['ok'=>true,'content'=>$result]);
    }
    if ($action!=='save') fail('接口不存在',404);
    $id=field('id'); if (!isset($state['groups'][$id])) fail('报名群不存在');
    $name=field('name'); $expires=field('expires'); $display=field('display'); $version=field('version');
    if ($name==='' || strlen($name)>180 || preg_match('/[\x00-\x1f]/',$name)) fail('请填写有效的群名称（最多60个汉字）');
    $date=DateTimeImmutable::createFromFormat('!Y-m-d',$expires);
    if (!$date || $date->format('Y-m-d')!==$expires) fail('请选择有效的到期日期');
    if (!in_array($display,['full','screenshot'],true)) fail('显示方式不正确');
    $uploaded=null;
    if (isset($_FILES['image']) && $_FILES['image']['error']!==UPLOAD_ERR_NO_FILE) {
        $f=$_FILES['image'];
        if (!is_int($f['error']) || $f['error']!==UPLOAD_ERR_OK || $f['size']>4*1024*1024 || $f['size']<1 || !is_uploaded_file($f['tmp_name'])) fail('上传失败，请选择4MB以内的图片');
        $info=@getimagesize($f['tmp_name']); $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
        $formats=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp'];
        if (!$info || !isset($formats[$mime]) || $info['mime']!==$mime || $info[0]<100 || $info[1]<100 || $info[0]>4096 || $info[1]>4096) fail('仅支持100–4096像素的PNG、JPG、WebP图片');
        if ($display==='screenshot' && ($info[0]!==400 || $info[1]!==654)) fail('此截图样式仅适用于400×654图片，其他尺寸请选择完整图片');
        if (!is_dir(join_dir().'/images') && !mkdir(join_dir().'/images',0700,true)) throw new RuntimeException('上传目录不可写');
        $uploaded=bin2hex(random_bytes(16)).'.'.$formats[$mime];
        if (!move_uploaded_file($f['tmp_name'],join_dir().'/images/'.$uploaded)) throw new RuntimeException('图片保存失败');
        @chmod(join_dir().'/images/'.$uploaded,0600);
    }
    try {
        $result=join_update(function(array &$s) use($id,$name,$expires,$display,$version,$uploaded) {
            if (!authenticated($s)) return 'auth';
            if (!hash_equals($s['groups'][$id]['version'],$version)) return 'conflict';
            if (!$uploaded && !$s['groups'][$id]['file'] && !in_array($id,['assessment','appearance'],true) && field('enabled')==='1') return 'missing-image';
            if (!$uploaded && $display==='screenshot' && $s['groups'][$id]['file']) {
                $info=@getimagesize(join_dir().'/images/'.$s['groups'][$id]['file']);
                if (!$info || $info[0]!==400 || $info[1]!==654) return 'dimensions';
            }
            $g=&$s['groups'][$id];$g['name']=$name;$g['expires']=$expires;$g['display']=$display;$g['enabled']=field('enabled')==='1';
            if ($uploaded) $g['file']=$uploaded;
            $g['version']=bin2hex(random_bytes(12));$g['updatedAt']=date(DATE_ATOM);join_audit($s,$uploaded?'更换群二维码':'修改报名入口',$id);return join_groups($s);
        });
    } catch(Throwable $e) { if($uploaded) @unlink(join_dir().'/images/'.$uploaded); throw $e; }
    if (is_string($result)) { if($uploaded) @unlink(join_dir().'/images/'.$uploaded); fail($result==='conflict'?'该群已被其他窗口更新，请刷新页面后再保存':($result==='auth'?'登录已失效':($result==='missing-image'?'请先上传此群二维码再开启展示':'请选择完整图片显示方式')),$result==='auth'?401:409); }
    reply(['ok'=>true,'groups'=>$result]);
} catch(Throwable $e) { error_log('Join admin: '.$e->getMessage()); reply(['error'=>'服务暂时不可用，请检查PHP扩展与数据目录权限'],500); }
