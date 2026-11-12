<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }
date_default_timezone_set('Asia/Shanghai');
const JOIN_PREFIX = "<?php http_response_code(404); exit; ?>\n";
function join_dir(): string { return __DIR__ . '/_join-private'; }
function join_defaults(): array {
    $groups = ['assessment' => ['name'=>'柒柒游电竞考核46群','expires'=>'2026-10-15','enabled'=>true,'display'=>'screenshot','file'=>'','version'=>'initial'],
        'appearance' => ['name'=>'柒柒游电竞颜值陪考核','expires'=>'2026-10-15','enabled'=>true,'display'=>'screenshot','file'=>'','version'=>'initial']];
    for ($i=3;$i<=6;$i++) $groups['group'.$i]=['name'=>'考核群'.$i,'expires'=>'','enabled'=>false,'display'=>'full','file'=>'','version'=>'initial'];
    return $groups;
}
function join_initial(): array { return ['admins'=>[],'groups'=>join_defaults(),'attempts'=>[],'audit'=>[]]; }
function join_normalize(array $state): array {
    if (!isset($state['admins'])) {
        $state['admins']=[];
        if (!empty($state['admin'])) $state['admins'][$state['admin']['username']]=$state['admin'];
        $state['attempts']=[];
    }
    unset($state['admin']);
    $state['groups']=array_replace(join_defaults(),$state['groups']??[]);
    return $state;
}
function join_read(): array {
    $file=join_dir().'/state.php';
    if (!is_file($file)) return join_initial();
    $h=fopen($file,'rb'); if (!$h || !flock($h,LOCK_SH)) throw new RuntimeException('读取失败');
    try { $raw=stream_get_contents($h); return join_normalize(json_decode(substr($raw,strlen(JOIN_PREFIX)),true,512,JSON_THROW_ON_ERROR)); }
    finally { flock($h,LOCK_UN); fclose($h); }
}
function join_update(callable $fn): mixed {
    if (!is_dir(join_dir()) && !mkdir(join_dir(),0700,true)) throw new RuntimeException('创建数据目录失败');
    $h=fopen(join_dir().'/state.php','c+b');
    if (!$h || !flock($h,LOCK_EX)) throw new RuntimeException('数据目录不可写');
    try {
        $raw=stream_get_contents($h);
        $state=$raw ? join_normalize(json_decode(substr($raw,strlen(JOIN_PREFIX)),true,512,JSON_THROW_ON_ERROR)) : join_initial();
        $result=$fn($state);
        $json=JOIN_PREFIX.json_encode($state,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        rewind($h); if (fwrite($h,$json)!==strlen($json)) throw new RuntimeException('保存失败');
        ftruncate($h,strlen($json)); fflush($h); @chmod(join_dir().'/state.php',0600);
        return $result;
    } finally { flock($h,LOCK_UN); fclose($h); }
}
function join_audit(array &$state,string $action,string $group='',?string $operator=null): void {
    array_unshift($state['audit'],['time'=>date(DATE_ATOM),'action'=>$action,'group'=>$group,'operator'=>$operator??($_SESSION['username']??'系统')]);
    $state['audit']=array_slice($state['audit'],0,100);
}
function join_groups(array $state): array {
    $out=[];
    foreach ($state['groups'] as $id=>$g) {
        $src=$g['file'] ? 'api/join.php?action=image&id='.$id.'&v='.$g['version'] : (in_array($id,['assessment','appearance'],true)?'images/join/'.$id.'-group.png':'');
        $out[$id]=['name'=>$g['name'],'expires'=>$g['expires'],'enabled'=>$g['enabled'],'display'=>$g['display'],'src'=>$src,'version'=>$g['version'],'updatedAt'=>$g['updatedAt']??null];
    }
    return $out;
}
function join_template(): array {
    return require __DIR__.'/assessment-template.php';
}
function join_editor_template(): array {
    $editable=require __DIR__.'/assessment-editor-fields.php';
    $out=[];
    $all=array_column(join_template(),null,'key');
    foreach ($editable as $key=>$config) {
        if (isset($all[$key])) $out[]=array_replace($all[$key],$config);
    }
    return $out;
}
function join_content(array $state): array {
    $values=[];$proUpdated=false;
    foreach(join_template() as $field) {
        $key=$field['key'];$value=$state['joinContent']['values'][$key]??null;
        if ($key==='supervision.5'&&in_array($value,['违举报','考官违规举报'],true)) $value='违规举报';
        // Retain amounts saved with the former combined guarantee text.
        if ($value===null && preg_match('/^(pc|mobile)\.deposit\.(fun|pro|top|demon)$/D',$key,$parts)) {
            $legacy=$state['joinContent']['values'][$parts[1].'.48']??'';
            $labels=['fun'=>'娱乐','pro'=>'PRO','top'=>'顶尖','demon'=>'魔王'];
            $pattern='/'.$labels[$parts[2]].'\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*元?/iu';
            if (preg_match($pattern,$legacy,$amount)) $value=$amount[1].'元';
            elseif (in_array($parts[2],['top','demon'],true) && preg_match('~顶尖\s*[/／、]\s*魔王\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*元?~u',$legacy,$amount)) $value=$amount[1].'元';
        }
        if ($key==='pc.deposit.pro' && empty($state['migrations']['pc-pro-500-20261017']) && is_string($value) && preg_match('/^300\s*元?$/u',trim($value))) { $value='500元';$proUpdated=true; }
        $values[$key]=$value??$field['value'];
    }
    return ['values'=>$values,'version'=>($state['joinContent']['version']??'initial').($proUpdated?'-pro500':'')];
}
function join_announcements(array $state): array {
    $out=[];
    foreach($state['joinAnnouncements']??[] as $a) {
        $out[]=['id'=>$a['id'],'title'=>$a['title'],'text'=>$a['text'],'createdAt'=>$a['createdAt'],
            'image'=>empty($a['file'])?'':'api/join.php?action=announcement-image&id='.$a['id']];
    }
    return $out;
}
function join_password(string $password): bool { return strlen($password)>=12 && strlen($password)<=72 && preg_match('/[a-zA-Z]/',$password) && preg_match('/[0-9]/',$password); }
function join_login_check(array &$s,string $username,string $password,bool $allowUsers=false): array|false|null {
    $ip=hash('sha256',($_SERVER['REMOTE_ADDR']??'')."\0".$username);
    $now=time();$s['attempts']=array_filter($s['attempts'],fn($v)=>$v['until']>$now);
    $attempt=$s['attempts'][$ip]??['count'=>0,'until'=>$now+900,'username'=>$username];
    $global=$s['attempts']['global']??['count'=>0,'until'=>$now+900];
    if($attempt['count']>=5||$global['count']>=120)return false;
    $account=$s['admins'][$username]??null;
    if(!$account&&$allowUsers)foreach($s['community']['accounts']??[] as $user)if($user['username']===$username){$account=$user;$account['_user']=true;break;}
    if(!$account||empty($account['hash'])||!password_verify($password,$account['hash'])){$attempt['count']++;$global['count']++;$s['attempts'][$ip]=$attempt;$s['attempts']['global']=$global;return null;}
    unset($s['attempts'][$ip]);if(empty($account['_user']))join_audit($s,'管理员登录','',$username);return $account;
}
