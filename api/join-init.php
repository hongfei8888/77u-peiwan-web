<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
define('JOIN_ENTRY',true);
require __DIR__.'/join-lib.php';
$username=$argv[1]??'';
if (!preg_match('/^[A-Za-z0-9_]{4,32}$/D',$username)) exit("用法：php api/join-init.php 管理员账号 [--reset]\n账号使用4–32位字母、数字、下划线。\n");
$state=join_read();
if (isset($state['admins'][$username]) && !in_array('--reset',$argv,true)) exit("该管理员已存在。如需重置此账号密码，请追加 --reset；其他账号和群资料不会被修改。\n");
function read_secret(string $prompt): string {
    fwrite(STDOUT,$prompt);
    $hide=PHP_OS_FAMILY!=='Windows' && function_exists('shell_exec') && stream_isatty(STDIN);
    if ($hide) shell_exec('stty -echo');
    try { return rtrim(fgets(STDIN)?:'',"\r\n"); }
    finally { if ($hide) shell_exec('stty echo'); fwrite(STDOUT,"\n"); }
}
$password=read_secret('设置密码（至少12位，含字母和数字）：');
$confirm=read_secret('再次输入密码：');
if ($password!==$confirm || !join_password($password)) exit("密码不一致或强度不足，未保存。\n");
join_update(function(array &$s) use($username,$password) {
    $s['admins'][$username]=['username'=>$username,'hash'=>password_hash($password,PASSWORD_DEFAULT),'generation'=>bin2hex(random_bytes(16))];
    $s['attempts']=array_filter($s['attempts'],fn($v)=>($v['username']??'')!==$username);
    join_audit($s,'创建或重置管理员','',$username);
});
echo "管理员已设置。访问网站 /join-admin.html 登录。\n";
