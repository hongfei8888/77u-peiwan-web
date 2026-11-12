<?php
declare(strict_types=1);
define('JOIN_ENTRY',true);
require __DIR__.'/join-lib.php';
ini_set('display_errors','0');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function out(array $body,int $code=200): never { http_response_code($code);header('Content-Type: application/json; charset=utf-8');echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);exit; }
function reject(string $message,int $code=400): never { out(['error'=>$message],$code); }
function textval(mixed $v,int $max=200): string { if(!is_string($v)||strlen($v)>$max||str_contains($v,"\0"))throw new InvalidArgumentException('输入内容不正确或超过长度限制');return trim($v); }
function nowstamp(): string { return date(DATE_ATOM); }
function community_init(array &$s): void {
    if(isset($s['community']))return;
    $seed=json_decode(file_get_contents(__DIR__.'/community-seed.json'),true,512,JSON_THROW_ON_ERROR);
    $s['community']=['accounts'=>[],'profiles'=>[],'posts'=>$seed['posts'],'moments'=>[],'assets'=>[],'notices'=>[],'log'=>[],'rates'=>[]];
    foreach($seed['companions'] as $i=>$p){
        $id='roster-'.($i+1);
        $s['community']['accounts'][$id]=['id'=>$id,'username'=>'player'.str_pad((string)($i+1),3,'0',STR_PAD_LEFT),'hash'=>null,'generation'=>bin2hex(random_bytes(16)),'role'=>'companion','status'=>'active','companionStatus'=>'approved','warnings'=>0,'seedName'=>$p['name'],'mustChangePassword'=>true,'createdAt'=>nowstamp()];
        $s['community']['profiles'][$id]=['nickname'=>$p['name'],'gender'=>$p['gender']??'不公开','service'=>$p['service']??'陪玩社区','level'=>$p['level']??'','tone'=>$p['tone']??'','bio'=>$p['bio']??'','categories'=>$p['categories']??[],'seedCard'=>$p,'publicConfirm'=>true,'status'=>'published','reviewStatus'=>'approved'];
    }
}
function manager(array $s): ?array {
    $a=$s['admins'][$_SESSION['username']??'']??null;
    return $a && ($_SESSION['expires']??0)>time() && isset($_SESSION['admin']) && hash_equals($a['generation'],$_SESSION['admin'])?$a:null;
}
function identity(array $s): ?array {
    if($a=manager($s))return ['id'=>'admin:'.$a['username'],'username'=>$a['username'],'role'=>'admin','status'=>'active','companionStatus'=>'none','warnings'=>0,'mustChangePassword'=>false];
    $a=$s['community']['accounts'][$_SESSION['userId']??'']??null;
    if(!$a||$a['status']!=='active'||($_SESSION['expires']??0)<=time()||!isset($_SESSION['userGeneration'])||!hash_equals($a['generation'],$_SESSION['userGeneration']))return null;
    return clean_account($a);
}
function clean_account(array $a): array { foreach(['hash','generation','securityHash'] as $k)unset($a[$k]);return $a; }
function require_user(array $s,bool $admin=false): array { $a=identity($s);if(!$a)throw new DomainException('请先登录',401);if($admin&&$a['role']!=='admin')throw new DomainException('需要管理员权限',403);return $a; }
function public_profile(array $c,string $id): bool { $a=$c['accounts'][$id]??null;$p=$c['profiles'][$id]??null;return $a&&$p&&$a['status']==='active'&&$a['companionStatus']==='approved'&&($p['status']??'')==='published'&&($p['publicConfirm']??false); }
function audit(array &$c,array $a,string $action,string $id,string $reason=''): void { array_unshift($c['log'],['id'=>bin2hex(random_bytes(8)),'operatorId'=>$a['id'],'operatorName'=>$a['username'],'action'=>$action,'targetId'=>$id,'detail'=>$reason,'createdAt'=>nowstamp()]);$c['log']=array_slice($c['log'],0,500); }
function notice(array &$c,string $id,string $type,string $message): void {$c['notices'][$id]??=[];array_unshift($c['notices'][$id],['type'=>$type,'message'=>$message,'createdAt'=>nowstamp()]);$c['notices'][$id]=array_slice($c['notices'][$id],0,50);}
function public_posts(array $c): array {return array_values(array_filter($c['posts'],fn($p)=>empty($p['deleted'])&&(!isset($p['accountId'])||!isset($c['accounts'][$p['accountId']])||$c['accounts'][$p['accountId']]['status']==='active')));}
function visible_moments(array $c): array {return array_values(array_filter($c['moments'],fn($m)=>public_profile($c,$m['accountId'])));}
require __DIR__.'/players-layout.php';
function snapshot(array $s): array {
    $c=$s['community'];$a=identity($s);$admin=$a&&$a['role']==='admin';$profiles=[];$public=[];
    foreach($c['profiles'] as $id=>$p){if(public_profile($c,$id))$public[]=array_merge($p,['accountId'=>$id]);if($admin||($a&&$a['id']===$id))$profiles[$id]=$p;}
    $accounts=$admin?array_values(array_map('clean_account',$c['accounts'])):[];
    if($admin)foreach($s['admins'] as $m)$accounts[]=['id'=>'admin:'.$m['username'],'username'=>$m['username'],'role'=>'admin','status'=>'active','companionStatus'=>'none','warnings'=>0];
    $moments=$admin?$c['moments']:visible_moments($c);
    if($a&&!$admin){foreach($c['moments'] as $m)if($m['accountId']===$a['id']&&!in_array($m,$moments,true))$moments[]=$m;}
    return ['playersLayout'=>players_layout($c),'current'=>$a,'accounts'=>$accounts,'profiles'=>(object)$profiles,'publicProfiles'=>$public,'moments'=>$moments,'posts'=>public_posts($c),'notices'=>$a?($c['notices'][$a['id']]??[]):[],'log'=>$admin?$c['log']:[],'csrf'=>$_SESSION['csrf'],'configured'=>(bool)$s['admins']];
}
function own_assets(array $c,array $a,array $keys,int $max): array {
    if(count($keys)>$max)throw new InvalidArgumentException('媒体数量超过限制');
    foreach($keys as $key)if(!is_string($key)||!isset($c['assets'][$key])||$c['assets'][$key]['owner']!==$a['id'])throw new DomainException('媒体文件不属于当前账号',403);
    return array_values($keys);
}
function profile_fields(array $p): array {
    $out=[];foreach(['nickname'=>64,'gender'=>24,'service'=>80,'level'=>64,'tone'=>80,'bio'=>640] as $k=>$limit)$out[$k]=textval($p[$k]??'',$limit);
    if($out['nickname']==='')throw new InvalidArgumentException('请填写昵称');
    $out['categories']=array_values(array_intersect(is_array($p['categories']??null)?$p['categories']:[],['歌手','声优','技术大神','颜值','魔王']));return $out;
}
function rate(array &$c,string $action,int $limit,int $seconds=900): bool {
    $key=hash('sha256',($_SERVER['REMOTE_ADDR']??'').':'.$action);$now=time();
    $c['rates']=array_filter($c['rates'],fn($r)=>$r['until']>$now);
    $r=$c['rates'][$key]??['count'=>0,'until'=>$now+$seconds];$r['count']++;$c['rates'][$key]=$r;return $r['count']<=$limit;
}
function user_password(string $p): void {if(strlen($p)<10||strlen($p)>72||!preg_match('/[A-Za-z]/',$p)||!preg_match('/[0-9]/',$p))throw new InvalidArgumentException('密码需10–72字节，包含字母和数字');}
function establish(array $a,bool $admin): void {session_regenerate_id(true);unset($_SESSION['admin'],$_SESSION['username'],$_SESSION['userId'],$_SESSION['userGeneration']);if($admin){$_SESSION['username']=$a['username'];$_SESSION['admin']=$a['generation'];}else{$_SESSION['userId']=$a['id'];$_SESSION['userGeneration']=$a['generation'];}$_SESSION['expires']=time()+7200;$_SESSION['csrf']=bin2hex(random_bytes(32));}
require __DIR__.'/assessment-messages.php';
try {
    $secure=!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off';
    if(!$secure&&!in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true))reject('请使用HTTPS访问',403);
    ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');session_name('qiqiyou_join_admin');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);session_start();
    $_SESSION['csrf']??=bin2hex(random_bytes(32));
    $s=join_read();if(!isset($s['community']))$s=join_update(function(array &$s){community_init($s);return $s;});
    $action=$_GET['action']??'snapshot';
    if($_SERVER['REQUEST_METHOD']==='GET'){
        if($action==='assessment-messages')assessment_message_list($s);
        if($action==='snapshot')out(snapshot($s));
        if($action==='captcha'){$x=random_int(2,9);$y=random_int(1,9);$id=bin2hex(random_bytes(8));$_SESSION['captcha']=['id'=>$id,'answer'=>(string)($x+$y),'expires'=>time()+300];out(['id'=>$id,'question'=>"$x + $y = ?"]);}
        if($action==='asset'){
            $key=textval($_GET['key']??'',180);$c=$s['community'];$asset=$c['assets'][$key]??null;if(!$asset)reject('文件不存在',404);
            $a=identity($s);$allowed=$a&&($a['role']==='admin'||$a['id']===$asset['owner']);
            if(!$allowed&&public_profile($c,$asset['owner'])&&str_starts_with($key,$asset['owner'].':'))$allowed=true;
            if(!$allowed){foreach(public_posts($c) as $p)if(in_array($key,$p['mediaKeys']??[],true)||(($p['accountId']??'')===$asset['owner']&&$key===$asset['owner'].':avatar'))$allowed=true;foreach(visible_moments($c) as $m)if(in_array($key,$m['imageKeys']??[],true))$allowed=true;}
            if(!$allowed)reject('文件未公开',404);
            $path=join_dir().'/community-media/'.$asset['file'];if(!is_file($path))reject('文件不存在',404);
            header('Content-Type: '.$asset['mime']);header('Content-Length: '.filesize($path));header('Content-Security-Policy: default-src \'none\'; sandbox');session_write_close();readfile($path);exit;
        }
        reject('接口不存在',404);
    }
    if($_SERVER['REQUEST_METHOD']!=='POST')reject('请求方式不支持',405);
    if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))reject('页面已失效，请刷新重试',403);
    $contentType=strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]));
    $d=$contentType==='application/json'?json_decode(file_get_contents('php://input'),true,64,JSON_THROW_ON_ERROR):$_POST;if(!is_array($d))reject('请求内容无效');
    if($action==='assessment-message-create')assessment_message_manage($action,$d);
    if(in_array($action,['register','recover'],true)){
        $username=strtolower(textval($d['username']??'',32));
        $ok=join_update(function(array &$s)use($action,$username){return rate($s['community'],($action==='register'?'register':$action.':'.$username),$action==='register'?5:10);});if(!$ok)reject('操作过于频繁，请15分钟后再试',429);
    }
    if($action==='login'){
        $username=strtolower(textval($d['username']??'',32));$password=textval($d['password']??'',72);
        $a=join_update(function(array &$s)use($username,$password){return join_login_check($s,$username,$password,true);});
        if($a===false)reject('登录尝试过多，请15分钟后重试',429);
        if($a===null)reject('账号或密码不正确',401);
        $isAdmin=empty($a['_user']);unset($a['_user']);
        if(!$isAdmin&&$a['status']!=='active')reject('账号已被暂停，请联系管理员',403);
        establish($a,$isAdmin);out(['snapshot'=>snapshot(join_read())]);
    }
    if($action==='register'){
        $cap=$_SESSION['captcha']??null;unset($_SESSION['captcha']);if(!$cap||$cap['expires']<time()||!hash_equals($cap['id'],(string)($d['captchaId']??''))||!hash_equals($cap['answer'],(string)($d['captchaAnswer']??'')))reject('验证码不正确，请重试');
        if(!preg_match('/^[a-z0-9_]{4,20}$/D',$username))reject('账号需4至20位字母、数字或下划线');
        $password=textval($d['password']??'',72);user_password($password);$question=textval($d['securityQuestion']??'',40);$answer=strtolower(textval($d['securityAnswer']??'',160));
        if(!in_array($question,['first_game','childhood_name','favorite_role','memorable_place'],true)||strlen($answer)<2)reject('请填写有效密保问题和答案');
        $a=join_update(function(array &$s)use($username,$password,$question,$answer){if(isset($s['admins'][$username]))throw new InvalidArgumentException('账号已存在');foreach($s['community']['accounts'] as $a)if($a['username']===$username)throw new InvalidArgumentException('账号已存在');$id=bin2hex(random_bytes(12));$a=['id'=>$id,'username'=>$username,'hash'=>password_hash($password,PASSWORD_DEFAULT),'generation'=>bin2hex(random_bytes(16)),'role'=>'user','status'=>'active','warnings'=>0,'companionStatus'=>'none','mustChangePassword'=>false,'securityQuestion'=>$question,'securityHash'=>password_hash($answer,PASSWORD_DEFAULT),'createdAt'=>nowstamp()];$s['community']['accounts'][$id]=$a;return $a;});establish($a,false);out(['snapshot'=>snapshot(join_read())]);
    }
    if($action==='question'||$action==='recover'){
        $username=strtolower(textval($d['username']??'',32));
        if($action==='question'){$ok=join_update(fn(array &$s)=>rate($s['community'],'question',20));if(!$ok)reject('操作过于频繁',429);}
        $target=null;foreach($s['community']['accounts'] as $a)if($a['username']===$username)$target=$a;
        if(!$target||empty($target['securityQuestion']))reject('账号不支持密保找回');
        if($action==='question')out(['id'=>$target['securityQuestion']]);
        $answer=strtolower(textval($d['answer']??'',160));$password=textval($d['password']??'',72);user_password($password);
        join_update(function(array &$s)use($target,$answer,$password){$a=&$s['community']['accounts'][$target['id']];if(!password_verify($answer,$a['securityHash']))throw new DomainException('密保答案不正确',403);$a['hash']=password_hash($password,PASSWORD_DEFAULT);$a['generation']=bin2hex(random_bytes(16));$a['mustChangePassword']=false;});out(['ok'=>true]);
    }
    $a=require_user($s);
    if($action==='logout'){$_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);out(['ok'=>true]);}
    if($a['role']!=='admin'&&($a['mustChangePassword']??false)&&$action!=='password')reject('请先修改临时密码',403);
    if($action==='assessment-message-delete')assessment_message_manage($action,$d);
    if($action==='upload'){
        $key=textval($d['key']??'',180);if(!preg_match('/^[a-zA-Z0-9:_-]{1,180}$/D',$key))reject('文件标识无效');
        $f=$_FILES['file']??null;if(!$f||$f['error']!==UPLOAD_ERR_OK||!is_uploaded_file($f['tmp_name'])||$f['size']<1||$f['size']>40*1024*1024)reject('上传失败，单文件最大40MB');
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$formats=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','audio/mpeg'=>'mp3','audio/wav'=>'wav','audio/x-wav'=>'wav','audio/mp4'=>'m4a','audio/ogg'=>'ogg','video/mp4'=>'mp4','video/webm'=>'webm'];if(!isset($formats[$mime]))reject('不支持此文件格式');
        if(str_starts_with($mime,'image/')){$info=@getimagesize($f['tmp_name']);if(!$info||$info['mime']!==$mime||$info[0]>8192||$info[1]>8192||$f['size']>5*1024*1024)reject('图片最大5MB、8192像素');}
        if(str_starts_with($mime,'audio/')&&$f['size']>15*1024*1024)reject('音频最大15MB');
        if(preg_match('/^(roster-\d+|[a-f0-9]{24}):/',$key,$m)&&$m[1]!==$a['id']&&$a['role']!=='admin')reject('不能替换他人媒体',403);
        $dir=join_dir().'/community-media';if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('无法创建媒体目录');$file=bin2hex(random_bytes(16)).'.'.$formats[$mime];if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$file))throw new RuntimeException('无法保存媒体');chmod($dir.'/'.$file,0600);
        try {join_update(function(array &$s)use($a,$key,$file,$mime){$live=require_user($s);if($live['id']!==$a['id'])throw new DomainException('登录已过期',401);$c=&$s['community'];if(isset($c['assets'][$key])&&$c['assets'][$key]['owner']!==$a['id']&&$a['role']!=='admin')throw new DomainException('不能替换他人媒体',403);$owner=$c['assets'][$key]['owner']??$a['id'];$c['assets'][$key]=['file'=>$file,'mime'=>$mime,'owner'=>$owner];});}catch(Throwable $e){unlink($dir.'/'.$file);throw $e;}out(['ok'=>true]);
    }
    $result=join_update(function(array &$s)use($action,$d){
        $a=require_user($s);$c=&$s['community'];$id=textval($d['id']??'',180);$value=null;
        if(in_array($action,['review','edit-profile','warn','status','seed','moderate-post','admin-delete-moment','players-layout-save'],true))require_user($s,true);
        switch($action){
        case 'players-layout-save':
            players_save($c,$d);$id='players-layout';break;
        case 'password':
            $old=textval($d['oldPassword']??'',72);$next=textval($d['newPassword']??'',72);$isAdmin=$a['role']==='admin';if($isAdmin&&!join_password($next))throw new InvalidArgumentException('管理员密码需12–72字节，包含字母和数字');user_password($next);
            if($isAdmin)$raw=&$s['admins'][$a['username']];else $raw=&$c['accounts'][$a['id']];if(!password_verify($old,$raw['hash']))throw new DomainException('当前密码不正确',403);$raw['hash']=password_hash($next,PASSWORD_DEFAULT);$raw['generation']=bin2hex(random_bytes(16));$raw['mustChangePassword']=false;establish($raw,$isAdmin);break;
        case 'security':
            if($a['role']==='admin')throw new DomainException('管理员请通过终端重置密码',403);$raw=&$c['accounts'][$a['id']];if(!password_verify(textval($d['password']??'',72),$raw['hash']))throw new DomainException('当前密码不正确',403);$q=textval($d['question']??'',40);if(!in_array($q,['first_game','childhood_name','favorite_role','memorable_place'],true))throw new InvalidArgumentException('密保问题无效');$answer=strtolower(textval($d['answer']??'',160));if(strlen($answer)<2)throw new InvalidArgumentException('密保答案太短');$raw['securityQuestion']=$q;$raw['securityHash']=password_hash($answer,PASSWORD_DEFAULT);break;
        case 'basic':
            if($id!==$a['id'])throw new DomainException('只能修改自己的资料',403);$nickname=textval($d['nickname']??'',64);if(strlen($nickname)<2)throw new InvalidArgumentException('请填写昵称');$c['profiles'][$id]['nickname']=$nickname;$value=$c['profiles'][$id];break;
        case 'submit':
            if($a['role']==='admin'||$id!==$a['id'])throw new DomainException('只能提交自己的认证资料',403);$p=profile_fields($d['profile']??[]);if(empty($d['profile']['publicConfirm']))throw new InvalidArgumentException('请确认公开资料');if(!isset($c['assets'][$id.':avatar']))throw new InvalidArgumentException('请上传头像');$media=$d['profile']['media']??[];$p['media']=['avatar'=>true,'galleryCount'=>max(0,min(6,(int)($media['galleryCount']??0))),'audio'=>isset($c['assets'][$id.':audio']),'video'=>isset($c['assets'][$id.':video'])];foreach(['avatarName','audioName','videoName'] as $k)$p['media'][$k]=textval($media[$k]??'',250);$p+=['status'=>'pending','reviewStatus'=>'pending','publicConfirm'=>true,'submittedAt'=>nowstamp(),'reviewReason'=>''];if(isset($c['profiles'][$id]['seedCard']))$p['seedCard']=$c['profiles'][$id]['seedCard'];$c['profiles'][$id]=$p;$c['accounts'][$id]['companionStatus']='pending';$value=$p;break;
        case 'edit-profile':
            if(!isset($c['profiles'][$id]))throw new InvalidArgumentException('陪玩资料不存在');$c['profiles'][$id]=array_merge($c['profiles'][$id],profile_fields($d['profile']??[]));$value=$c['profiles'][$id];break;
        case 'review':
            if(!isset($c['profiles'][$id],$c['accounts'][$id]))throw new InvalidArgumentException('认证资料不存在');$decision=textval($d['decision']??'',20);if(!in_array($decision,['approved','rejected'],true))throw new InvalidArgumentException('审核结果无效');$reason=textval($d['reason']??'',800);$p=&$c['profiles'][$id];$p['reviewStatus']=$decision;$p['status']=$decision==='approved'?'published':'rejected';$p['reviewReason']=$reason;$p['reviewedAt']=nowstamp();$c['accounts'][$id]['companionStatus']=$decision;$c['accounts'][$id]['role']=$decision==='approved'?'companion':'user';notice($c,$id,'review',$decision==='approved'?'陪玩认证已通过':'陪玩认证未通过：'.$reason);break;
        case 'warn': case 'status':
            if(!isset($c['accounts'][$id]))throw new InvalidArgumentException('只能操作普通用户或陪玩账号');$reason=textval($d['reason']??'',800);if($reason==='')throw new InvalidArgumentException('请填写操作原因');if($action==='warn'){$c['accounts'][$id]['warnings']++;notice($c,$id,'warning',$reason);}else{$status=textval($d['status']??'',20);if(!in_array($status,['active','suspended'],true))throw new InvalidArgumentException('账号状态无效');$c['accounts'][$id]['status']=$status;$c['accounts'][$id]['generation']=bin2hex(random_bytes(16));notice($c,$id,$status,$reason);}break;
        case 'seed':
            $value=[];foreach($c['accounts'] as &$raw){if(empty($raw['seedName'])||!empty($raw['hash']))continue;$password='Q7!'.bin2hex(random_bytes(10));$raw['hash']=password_hash($password,PASSWORD_DEFAULT);$value[]=['username'=>$raw['username'],'nickname'=>$raw['seedName'],'temporaryPassword'=>$password];}unset($raw);break;
        case 'post':
            if(!rate($c,'post',30))throw new DomainException('发帖过于频繁',429);$p=$d['post']??[];$id=textval($p['id']??'',100);if(!preg_match('/^user-[a-z0-9-]+$/D',$id))throw new InvalidArgumentException('帖子标识无效');foreach($c['posts'] as $old)if($old['id']===$id)throw new InvalidArgumentException('帖子已存在');$title=textval($p['title']??'',240);$content=textval($p['content']??'',40000);$category=textval($p['category']??'',40);if($title===''||strlen($content)<6||!in_array($category,['公告','攻略','找搭子','战绩','陪玩日常','闲聊'],true))throw new InvalidArgumentException('请填写完整帖子');if($category==='公告'&&$a['role']!=='admin')throw new DomainException('公告只允许管理员发布',403);$keys=own_assets($c,$a,$p['mediaKeys']??[],8);$p=['id'=>$id,'accountId'=>$a['id'],'author'=>$c['profiles'][$a['id']]['nickname']??$a['username'],'category'=>$category,'title'=>$title,'content'=>$content,'contentMd'=>$content,'mediaKeys'=>$keys,'thumbnailKey'=>in_array($p['thumbnailKey']??'',$keys,true)?$p['thumbnailKey']:'','createdAt'=>(int)(microtime(true)*1000),'views'=>0,'likes'=>0,'replies'=>0,'official'=>$a['role']==='admin','companion'=>$a['companionStatus']==='approved'];array_unshift($c['posts'],$p);$value=$p;break;
        case 'moderate-post': case 'like': case 'reply':
            $index=null;foreach($c['posts'] as $i=>$p)if($p['id']===$id&&empty($p['deleted']))$index=$i;if($index===null)throw new InvalidArgumentException('帖子不存在或已删除');$p=&$c['posts'][$index];
            if($action==='moderate-post'){$op=textval($d['operation']??'',24);$reason=textval($d['reason']??'',800);if($op==='delete'){if($reason==='')throw new InvalidArgumentException('请填写删帖原因');$p['deleted']=true;}elseif($op==='pin')$p['pinned']=($d['pinned']??false)===true;elseif($op==='category'){$cat=textval($d['category']??'',40);if(!in_array($cat,['公告','攻略','找搭子','战绩','陪玩日常','闲聊'],true))throw new InvalidArgumentException('分区无效');$p['category']=$cat;}else throw new InvalidArgumentException('操作无效');}
            elseif($action==='like'){$ids=$p['likedBy']??[];$j=array_search($a['id'],$ids,true);if($j===false)$ids[]=$a['id'];else array_splice($ids,$j,1);$p['likedBy']=$ids;}
            else{if(!rate($c,'reply',60))throw new DomainException('回复过于频繁',429);$content=textval($d['content']??'',4000);if($content==='')throw new InvalidArgumentException('回复不能为空');$p['replyItems'][]=['accountId'=>$a['id'],'author'=>$c['profiles'][$a['id']]['nickname']??$a['username'],'content'=>$content,'createdAt'=>(int)(microtime(true)*1000)];}break;
        case 'moment':
            if($id!==$a['id']||!public_profile($c,$id))throw new DomainException('认证通过后才能发布动态',403);if(!rate($c,'moment',30))throw new DomainException('发布过于频繁',429);$p=$d['payload']??[];$content=textval($p['content']??'',2000);$keys=own_assets($c,$a,$p['imageKeys']??[],9);foreach($keys as $k)if(!str_starts_with($c['assets'][$k]['mime'],'image/'))throw new InvalidArgumentException('动态仅支持图片');if($content===''&&!$keys)throw new InvalidArgumentException('请填写内容或上传图片');$value=['id'=>bin2hex(random_bytes(12)),'accountId'=>$id,'author'=>$c['profiles'][$id]['nickname'],'content'=>$content,'imageKeys'=>$keys,'createdAt'=>nowstamp()];array_unshift($c['moments'],$value);break;
        case 'delete-moment': case 'admin-delete-moment':
            $target=null;foreach($c['moments'] as $m)if($m['id']===$id)$target=$m;if(!$target)throw new InvalidArgumentException('动态不存在');if($action==='delete-moment'&&$target['accountId']!==$a['id'])throw new DomainException('只能删除自己的动态',403);if($action==='admin-delete-moment'&&textval($d['reason']??'',800)==='')throw new InvalidArgumentException('请填写删除原因');$c['moments']=array_values(array_filter($c['moments'],fn($m)=>$m['id']!==$id));break;
        case 'delete-asset':
            if(!isset($c['assets'][$id]))break;if($c['assets'][$id]['owner']!==$a['id']&&$a['role']!=='admin')throw new DomainException('不能删除他人文件',403);unset($c['assets'][$id]);break;
        default:throw new InvalidArgumentException('接口不存在');
        }
        if(!in_array($action,['like','reply'],true))audit($c,$a,$action,$id,textval($d['reason']??'',800));
        return ['value'=>$value,'snapshot'=>snapshot($s)];
    });out($result);
}catch(DomainException $e){out(['error'=>$e->getMessage()],in_array($e->getCode(),[401,403,404,409,429],true)?$e->getCode():403);}catch(InvalidArgumentException|JsonException $e){out(['error'=>$e->getMessage()],400);}catch(Throwable $e){error_log('Community: '.$e->getMessage());out(['error'=>'服务暂时不可用，请检查PHP扩展与后台目录权限'],500);}
