<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root=realpath(__DIR__);
$page=@file_get_contents($root.'/join.html');
if (!$page || !str_contains($page,'js/join-recruit.js') || !is_file($root.'/css/join-recruit.css')) {
    fwrite(STDERR,"请先完整解压本次精简版升级包，再执行清理。\n"); exit(1);
}
$files=['css/join.css','css/join-polish.css','css/join-motion.css','css/join-youth.css','css/join-layout.css','js/join.js','js/join-motion.js','api/join-template.json','images/join/qianduoduo-contact.png'];
$backup=$root.'/api/_join-private/retired-join-'.date('Ymd-His').'-'.bin2hex(random_bytes(3));
$count=0;
foreach ($files as $name) {
    $path=$root.'/'.$name;
    if (!file_exists($path)) continue;
    $resolved=realpath($path);
    if (is_link($path) || !is_file($path) || !$resolved || !str_starts_with($resolved,$root.DIRECTORY_SEPARATOR)) {
        fwrite(STDERR,"跳过异常路径：$name\n"); continue;
    }
    $target=$backup.'/'.$name;
    if (!is_dir(dirname($target)) && !mkdir(dirname($target),0700,true)) { fwrite(STDERR,"备份目录不可写，未删除旧文件。\n"); exit(1); }
    if (!copy($path,$target) || !hash_equals(hash_file('sha256',$path),hash_file('sha256',$target))) {
        fwrite(STDERR,"备份校验失败，未删除旧文件：$name\n"); exit(1);
    }
    chmod($target,0600);
    if (!unlink($path)) { fwrite(STDERR,"旧文件未能清理：$name\n"); exit(1); }
    $count++;
}
echo "已清理 $count 个旧页面资源；账号、二维码和社区运行数据保持原样。\n";
if ($count) echo "旧资源备份：$backup\n";
