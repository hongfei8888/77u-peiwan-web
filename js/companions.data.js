(function () {
  "use strict";

  var image = function (name) { return "images/companions/" + name + ".webp"; };
  var video = function (name) { return "media/companions/video/" + name + ".mp4"; };
  var audio = function (name) { return "media/companions/audio/" + name + ".mp3"; };
  var femalePlaceholder = "images/brand/female-avatar-3857d93d2250.webp";
  var malePlaceholder = "images/brand/male-avatar-807aa04e4358.webp";

  window.COMPANION_CATEGORIES = Object.freeze({
    ge: { title: "柒哥严选", kicker: "QI PICKS" },
    yue: { title: "月姐推荐", kicker: "YUE RECOMMENDS" },
    singer: { title: "歌手", kicker: "SINGER" },
    voice: { title: "声优", kicker: "VOICE" },
    technical: { title: "技术大神", kicker: "SKILL" },
    appearance: { title: "颜值", kicker: "LOOKS" },
    demon: { title: "魔王", kicker: "DEMON RANK" },
    community: { title: "社区新成员", kicker: "COMMUNITY NEW" }
  });

  window.COMPANION_DATA = Object.freeze([
    { name: "小透明", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["ge", "voice", "appearance"], avatar: "images/companions/player-5ab5b3a3bf3c.webp", video: "media/companions/video/player-5ab5b3a3bf3c.mp4", audio: "media/companions/audio/player-5ab5b3a3bf3c.mp3" },
    { name: "早晚", gender: "女", level: "大S", tone: "御姐音", service: "端游娱乐", groups: ["ge", "voice", "appearance"], avatar: "images/companions/player-bb24698389ce.webp", video: "media/companions/video/player-bb24698389ce.mp4", audio: "media/companions/audio/player-bb24698389ce.mp3" },
    { name: "PA", gender: "男", level: "顶尖", tone: "资料待补充", service: "端游技术", groups: ["ge", "technical", "appearance"], avatar: image("PA") },
    { name: "有风", gender: "男", level: "魔王", tone: "青年音", service: "端游技术", groups: ["ge", "singer", "voice", "technical", "demon"], avatar: malePlaceholder, audio: "media/companions/audio/player-3760f3e55000.mp3", placeholder: true },

    { name: "鹅宝", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["yue", "appearance"], avatar: "images/companions/player-619315e83387.webp", video: "media/companions/video/player-619315e83387.mp4" },
    { name: "薇恩", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["yue", "appearance"], avatar: "images/companions/player-e73809f616b9.webp", video: "media/companions/video/player-e73809f616b9.mp4" },
    { name: "麻辣兔", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["yue", "appearance"], avatar: "images/companions/player-2c7bb54e3000.webp", video: "media/companions/video/player-2c7bb54e3000.mp4" },
    { name: "诗妤", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["yue", "appearance"], avatar: "images/companions/player-154a755d25ab.webp", video: "media/companions/video/player-154a755d25ab.mp4" },

    { name: "雪饼", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-0f3b08f1cbb9.mp3", placeholder: true },
    { name: "葬爱冷少", gender: "女", level: "大S", tone: "御姐音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-acdeef7bb9c1.mp3", placeholder: true },
    { name: "雪花", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-4c1d79e56f4a.mp3", placeholder: true },
    { name: "小Mi", gender: "女", level: "Pro", tone: "少女音 · 少御音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: audio("Mi"), placeholder: true },
    { name: "陈可", gender: "女", level: "大S", tone: "御姐音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-83e5c79aeb8f.mp3", placeholder: true },
    { name: "雾里", gender: "女", level: "大S", tone: "少御音", service: "端游娱乐", groups: ["singer", "voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-d08b6b891a6b.mp3", placeholder: true },

    { name: "讯号", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-9bc31b1c7457.mp3", placeholder: true },
    { name: "路小雨", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-b288de582773.mp3", placeholder: true },
    { name: "小梦", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-5dcde6bb4a0d.mp3", placeholder: true },
    { name: "冷", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-6e87e42fbc22.mp3", placeholder: true },
    { name: "小尾猫猫", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-c5fd973c798b.mp3", placeholder: true },
    { name: "小怜", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-47c30b8580cd.mp3", placeholder: true },
    { name: "小瑜", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-6b351df2a25b.mp3", placeholder: true },
    { name: "小思绪", gender: "未公开", level: "资料待补充", tone: "声音样片", service: "声音陪伴", groups: ["voice"], avatar: femalePlaceholder, audio: "media/companions/audio/player-1e19dc95bda3.mp3", placeholder: true },

    { name: "华莱士", gender: "男", level: "魔王", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance", "demon"], avatar: malePlaceholder, placeholder: true },
    { name: "拾玖", gender: "男", level: "魔王", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance", "demon"], avatar: "images/companions/player-0a2013eafa9b.webp" },
    { name: "dash", gender: "男", level: "顶尖", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance"], avatar: malePlaceholder, placeholder: true },
    { name: "以南", gender: "男", level: "魔王", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance", "demon"], avatar: malePlaceholder, placeholder: true },
    { name: "天才大叔", gender: "男", level: "魔王", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance", "demon"], avatar: "images/companions/player-6fd691a81973.webp" },
    { name: "云天明", gender: "男", level: "顶尖 · 瓦神话", tone: "资料待补充", service: "端游技术", groups: ["technical", "appearance"], avatar: malePlaceholder, placeholder: true },

    { name: "佐素梨", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-1122e04fe22a.webp" },
    { name: "肉包", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-578b5be456f0.webp", video: "media/companions/video/player-578b5be456f0.mp4" },
    { name: "麻辣土豆", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-b4973c58d2e7.webp", video: "media/companions/video/player-b4973c58d2e7.mp4" },
    { name: "小梦宝", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-9f6360299d09.webp", video: "media/companions/video/player-9f6360299d09.mp4" },
    { name: "荔枝", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: femalePlaceholder, placeholder: true },
    { name: "鱼丸", gender: "女", level: "大S", tone: "御姐音", service: "端游娱乐", groups: ["appearance"], avatar: femalePlaceholder, placeholder: true },
    { name: "格调", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-77525e3eac19.webp", video: "media/companions/video/player-77525e3eac19.mp4" },
    { name: "小琪", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: femalePlaceholder, placeholder: true },
    { name: "懒羊羊", gender: "女", level: "大S", tone: "少御音", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-a5aadda033bf.webp" },
    { name: "糖墨", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-7c51a8842fb2.webp" },
    { name: "婉婉", gender: "女", level: "大S", tone: "少女音", service: "端游娱乐", groups: ["appearance"], avatar: "images/companions/player-91dccc3e986f.webp", video: "media/companions/video/player-91dccc3e986f.mp4" },
    { name: "石开", gender: "女", level: "大S", tone: "资料待补充", service: "端游娱乐", groups: ["appearance"], avatar: femalePlaceholder, placeholder: true }
  ]);
}());
