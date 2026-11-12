<?php
declare(strict_types=1);
if (!defined('JOIN_ENTRY')) { http_response_code(404); exit; }
return json_decode(<<<'ASSESSMENT_SCHEMA'
[
  {
    "key": "pc.1",
    "section": "端游考核",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false
  },
  {
    "key": "pc.2",
    "section": "端游考核",
    "label": "三角洲端游",
    "value": "三角洲端游",
    "multiline": false
  },
  {
    "key": "pc.3",
    "section": "端游考核",
    "label": "单考 · 考核说明",
    "value": "单考 · 共考核3局，全程考官自杀",
    "multiline": false
  },
  {
    "key": "pc.4",
    "section": "端游考核",
    "label": "单考 · 表头 · 档位列标题",
    "value": "档位",
    "multiline": false
  },
  {
    "key": "pc.5",
    "section": "端游考核",
    "label": "单考 · 表头 · 击杀列标题",
    "value": "累计击杀",
    "multiline": false
  },
  {
    "key": "pc.6",
    "section": "端游考核",
    "label": "单考 · 表头 · 物资列标题",
    "value": "物资价值（去金红）",
    "multiline": false
  },
  {
    "key": "pc.7",
    "section": "端游考核",
    "label": "单考 · 表头 · 装备列标题",
    "value": "装备",
    "multiline": false
  },
  {
    "key": "pc.8",
    "section": "端游考核",
    "label": "单考 · PRO · 档位名称",
    "value": "PRO",
    "multiline": false
  },
  {
    "key": "pc.9",
    "section": "端游考核",
    "label": "单考 · PRO · 累计击杀（≥ 数值）",
    "value": "≥ 20",
    "multiline": false
  },
  {
    "key": "pc.10",
    "section": "端游考核",
    "label": "单考 · PRO · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.11",
    "section": "端游考核",
    "label": "单考 · PRO · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "pc.12",
    "section": "端游考核",
    "label": "单考 · 顶尖 · 档位名称",
    "value": "顶尖",
    "multiline": false
  },
  {
    "key": "pc.13",
    "section": "端游考核",
    "label": "单考 · 顶尖 · 累计击杀（≥ 数值）",
    "value": "≥ 24",
    "multiline": false
  },
  {
    "key": "pc.14",
    "section": "端游考核",
    "label": "单考 · 顶尖 · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.15",
    "section": "端游考核",
    "label": "单考 · 顶尖 · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "pc.16",
    "section": "端游考核",
    "label": "单考 · 魔王 · 档位名称",
    "value": "魔王",
    "multiline": false
  },
  {
    "key": "pc.17",
    "section": "端游考核",
    "label": "单考 · 魔王 · 累计击杀（≥ 数值）",
    "value": "≥ 27",
    "multiline": false
  },
  {
    "key": "pc.18",
    "section": "端游考核",
    "label": "单考 · 魔王 · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.19",
    "section": "端游考核",
    "label": "单考 · 魔王 · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "pc.20",
    "section": "端游考核",
    "label": "3局内成功撤离1局。可以养猪（不能扒装备），禁止携带备头备甲，禁",
    "value": "3局内成功撤离1局。可以养猪（不能扒装备），禁止携带备头备甲，禁止使用步枪连狙红弹。",
    "multiline": false
  },
  {
    "key": "pc.21",
    "section": "端游考核",
    "label": "双考 · 考核说明",
    "value": "双考 · 共考核3局，全程考官自杀",
    "multiline": false
  },
  {
    "key": "pc.22",
    "section": "端游考核",
    "label": "双考 · 表头 · 档位列标题",
    "value": "档位",
    "multiline": false
  },
  {
    "key": "pc.23",
    "section": "端游考核",
    "label": "双考 · 表头 · 击杀列标题",
    "value": "累计击杀",
    "multiline": false
  },
  {
    "key": "pc.24",
    "section": "端游考核",
    "label": "双考 · 表头 · 物资列标题",
    "value": "物资价值（去金红）",
    "multiline": false
  },
  {
    "key": "pc.25",
    "section": "端游考核",
    "label": "双考 · 表头 · 装备列标题",
    "value": "装备",
    "multiline": false
  },
  {
    "key": "pc.26",
    "section": "端游考核",
    "label": "双考 · PRO · 档位名称",
    "value": "PRO",
    "multiline": false
  },
  {
    "key": "pc.27",
    "section": "端游考核",
    "label": "双考 · PRO · 累计击杀（≥ 数值）",
    "value": "≥ 24",
    "multiline": false
  },
  {
    "key": "pc.28",
    "section": "端游考核",
    "label": "双考 · PRO · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.29",
    "section": "端游考核",
    "label": "双考 · PRO · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "pc.30",
    "section": "端游考核",
    "label": "双考 · 顶尖 · 档位名称",
    "value": "顶尖",
    "multiline": false
  },
  {
    "key": "pc.31",
    "section": "端游考核",
    "label": "双考 · 顶尖 · 累计击杀（≥ 数值）",
    "value": "≥ 28",
    "multiline": false
  },
  {
    "key": "pc.32",
    "section": "端游考核",
    "label": "双考 · 顶尖 · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.33",
    "section": "端游考核",
    "label": "双考 · 顶尖 · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "pc.34",
    "section": "端游考核",
    "label": "双考 · 魔王 · 档位名称",
    "value": "魔王",
    "multiline": false
  },
  {
    "key": "pc.35",
    "section": "端游考核",
    "label": "双考 · 魔王 · 累计击杀（≥ 数值）",
    "value": "≥ 33",
    "multiline": false
  },
  {
    "key": "pc.36",
    "section": "端游考核",
    "label": "双考 · 魔王 · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "pc.37",
    "section": "端游考核",
    "label": "双考 · 魔王 · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "pc.38",
    "section": "端游考核",
    "label": "3局内成功撤离1局；两人3局总击杀人头差≤5。禁止养猪（重复人头",
    "value": "3局内成功撤离1局；两人3局总击杀人头差≤5。禁止养猪（重复人头需扣除）、禁止携带备头备甲、禁止使用步枪连狙红弹，禁止进图6套AW一人使用。",
    "multiline": true
  },
  {
    "key": "pc.39",
    "section": "端游考核",
    "label": "娱乐只能单考，二取一，第一把指定航天，只招女生。",
    "value": "娱乐只能单考，二取一，第一把指定航天，只招女生。",
    "multiline": false
  },
  {
    "key": "pc.40",
    "section": "端游考核",
    "label": "小S",
    "value": "小S",
    "multiline": false
  },
  {
    "key": "pc.41",
    "section": "端游考核",
    "label": "至少熟悉巴克什和航天两张地图，机密进图和考官双排两把，需要熟图且",
    "value": "至少熟悉巴克什和航天两张地图，机密进图和考官双排两把，需要熟图且能够提供情绪价值。",
    "multiline": false
  },
  {
    "key": "pc.42",
    "section": "端游考核",
    "label": "大S",
    "value": "大S",
    "multiline": false
  },
  {
    "key": "pc.43",
    "section": "端游考核",
    "label": "在小S要求的基础上，需击杀一人并成功让考官100W撤离，不限制撤",
    "value": "在小S要求的基础上，需击杀一人并成功让考官100W撤离，不限制撤离方式。",
    "multiline": false
  },
  {
    "key": "pc.44",
    "section": "端游考核",
    "label": "考核费用",
    "value": "考核费用",
    "multiline": false
  },
  {
    "key": "pc.45",
    "section": "端游考核",
    "label": "30元 / 人 / 次",
    "value": "30元 / 人 / 次",
    "multiline": false
  },
  {
    "key": "pc.46",
    "section": "端游考核",
    "label": "文考10元 / 次 · 查挂55元（自费）",
    "value": "文考10元 / 次 · 查挂55元（自费）",
    "multiline": false
  },
  {
    "key": "pc.47",
    "section": "端游考核",
    "label": "服务质量保证金 · 不可单抵",
    "value": "服务质量保证金 · 不可单抵",
    "multiline": false
  },
  {
    "key": "pc.deposit.fun",
    "section": "端游考核",
    "label": "保证金 · 娱乐",
    "value": "300元",
    "multiline": false
  },
  {
    "key": "pc.deposit.pro",
    "section": "端游考核",
    "label": "保证金 · PRO",
    "value": "500元",
    "multiline": false
  },
  {
    "key": "pc.deposit.top",
    "section": "端游考核",
    "label": "保证金 · 顶尖",
    "value": "500元",
    "multiline": false
  },
  {
    "key": "pc.deposit.demon",
    "section": "端游考核",
    "label": "保证金 · 魔王",
    "value": "500元",
    "multiline": false
  },
  {
    "key": "pc.49",
    "section": "端游考核",
    "label": "年满18岁 · 自备钻石段位以上账号",
    "value": "年满18岁 · 自备钻石段位以上账号",
    "multiline": false
  },
  {
    "key": "pc.50",
    "section": "端游考核",
    "label": "展开原文",
    "value": "展开原文",
    "multiline": false
  },
  {
    "key": "pc.51",
    "section": "端游考核",
    "label": "请先阅读左侧考核注意事项，提前准备好设备、账号与考核资金。完整规",
    "value": "请先阅读左侧考核注意事项，提前准备好设备、账号与考核资金。完整规则以对应平台在线原文为准。",
    "multiline": false
  },
  {
    "key": "mobile.1",
    "section": "手游考核",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false
  },
  {
    "key": "mobile.2",
    "section": "手游考核",
    "label": "三角洲手游",
    "value": "三角洲手游",
    "multiline": false
  },
  {
    "key": "mobile.3",
    "section": "手游考核",
    "label": "单考 · 考核说明",
    "value": "单考 · 共考核3局，全程考官自杀",
    "multiline": false
  },
  {
    "key": "mobile.4",
    "section": "手游考核",
    "label": "单考 · 表头 · 档位列标题",
    "value": "档位",
    "multiline": false
  },
  {
    "key": "mobile.5",
    "section": "手游考核",
    "label": "单考 · 表头 · 击杀列标题",
    "value": "累计击杀",
    "multiline": false
  },
  {
    "key": "mobile.6",
    "section": "手游考核",
    "label": "单考 · 表头 · 物资列标题",
    "value": "物资价值（去金红）",
    "multiline": false
  },
  {
    "key": "mobile.7",
    "section": "手游考核",
    "label": "单考 · 表头 · 装备列标题",
    "value": "装备",
    "multiline": false
  },
  {
    "key": "mobile.8",
    "section": "手游考核",
    "label": "单考 · PRO · 档位名称",
    "value": "PRO",
    "multiline": false
  },
  {
    "key": "mobile.9",
    "section": "手游考核",
    "label": "单考 · PRO · 累计击杀（≥ 数值）",
    "value": "≥ 18",
    "multiline": false
  },
  {
    "key": "mobile.10",
    "section": "手游考核",
    "label": "单考 · PRO · 物资价值",
    "value": "≥ 600W",
    "multiline": false
  },
  {
    "key": "mobile.11",
    "section": "手游考核",
    "label": "单考 · PRO · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "mobile.12",
    "section": "手游考核",
    "label": "单考 · 顶尖 · 档位名称",
    "value": "顶尖",
    "multiline": false
  },
  {
    "key": "mobile.13",
    "section": "手游考核",
    "label": "单考 · 顶尖 · 累计击杀（≥ 数值）",
    "value": "≥ 24",
    "multiline": false
  },
  {
    "key": "mobile.14",
    "section": "手游考核",
    "label": "单考 · 顶尖 · 物资价值",
    "value": "≥ 700W",
    "multiline": false
  },
  {
    "key": "mobile.15",
    "section": "手游考核",
    "label": "单考 · 顶尖 · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "mobile.16",
    "section": "手游考核",
    "label": "单考 · 魔王 · 档位名称",
    "value": "魔王",
    "multiline": false
  },
  {
    "key": "mobile.17",
    "section": "手游考核",
    "label": "单考 · 魔王 · 累计击杀（≥ 数值）",
    "value": "≥ 27",
    "multiline": false
  },
  {
    "key": "mobile.18",
    "section": "手游考核",
    "label": "单考 · 魔王 · 物资价值",
    "value": "≥ 800W",
    "multiline": false
  },
  {
    "key": "mobile.19",
    "section": "手游考核",
    "label": "单考 · 魔王 · 装备要求",
    "value": "6套 + AW",
    "multiline": false
  },
  {
    "key": "mobile.20",
    "section": "手游考核",
    "label": "3局内成功撤离1局。可以养猪（不能扒装备），禁止携带备头备甲，禁",
    "value": "3局内成功撤离1局。可以养猪（不能扒装备），禁止携带备头备甲，禁止使用步枪连狙红弹。",
    "multiline": false
  },
  {
    "key": "mobile.21",
    "section": "手游考核",
    "label": "双考 · 考核说明",
    "value": "双考 · 共考核3局，全程考官自杀",
    "multiline": false
  },
  {
    "key": "mobile.22",
    "section": "手游考核",
    "label": "双考 · 表头 · 档位列标题",
    "value": "档位",
    "multiline": false
  },
  {
    "key": "mobile.23",
    "section": "手游考核",
    "label": "双考 · 表头 · 击杀列标题",
    "value": "累计击杀",
    "multiline": false
  },
  {
    "key": "mobile.24",
    "section": "手游考核",
    "label": "双考 · 表头 · 物资列标题",
    "value": "物资价值（去金红）",
    "multiline": false
  },
  {
    "key": "mobile.25",
    "section": "手游考核",
    "label": "双考 · 表头 · 装备列标题",
    "value": "装备",
    "multiline": false
  },
  {
    "key": "mobile.26",
    "section": "手游考核",
    "label": "双考 · PRO · 档位名称",
    "value": "PRO",
    "multiline": false
  },
  {
    "key": "mobile.27",
    "section": "手游考核",
    "label": "双考 · PRO · 累计击杀（≥ 数值）",
    "value": "≥ 24",
    "multiline": false
  },
  {
    "key": "mobile.28",
    "section": "手游考核",
    "label": "双考 · PRO · 物资价值",
    "value": "≥ 1400W",
    "multiline": false
  },
  {
    "key": "mobile.29",
    "section": "手游考核",
    "label": "双考 · PRO · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "mobile.30",
    "section": "手游考核",
    "label": "双考 · 顶尖 · 档位名称",
    "value": "顶尖",
    "multiline": false
  },
  {
    "key": "mobile.31",
    "section": "手游考核",
    "label": "双考 · 顶尖 · 累计击杀（≥ 数值）",
    "value": "≥ 29",
    "multiline": false
  },
  {
    "key": "mobile.32",
    "section": "手游考核",
    "label": "双考 · 顶尖 · 物资价值",
    "value": "≥ 1600W",
    "multiline": false
  },
  {
    "key": "mobile.33",
    "section": "手游考核",
    "label": "双考 · 顶尖 · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "mobile.34",
    "section": "手游考核",
    "label": "双考 · 魔王 · 档位名称",
    "value": "魔王",
    "multiline": false
  },
  {
    "key": "mobile.35",
    "section": "手游考核",
    "label": "双考 · 魔王 · 累计击杀（≥ 数值）",
    "value": "≥ 33",
    "multiline": false
  },
  {
    "key": "mobile.36",
    "section": "手游考核",
    "label": "双考 · 魔王 · 物资价值",
    "value": "≥ 1800W",
    "multiline": false
  },
  {
    "key": "mobile.37",
    "section": "手游考核",
    "label": "双考 · 魔王 · 装备要求",
    "value": "6套 / AW 二选一",
    "multiline": false
  },
  {
    "key": "mobile.38",
    "section": "手游考核",
    "label": "3局内成功撤离2局；两人3局总击杀人头差≤6。禁止养猪（重复人头",
    "value": "3局内成功撤离2局；两人3局总击杀人头差≤6。禁止养猪（重复人头需扣除）、禁止携带备头备甲、禁止使用步枪连狙红弹，禁止进图6套AW一人使用。物资计算撤离物资总和（跟队一局计算三人总和）。",
    "multiline": true
  },
  {
    "key": "mobile.39",
    "section": "手游考核",
    "label": "娱乐只能单考，二取一，第一把指定航天，只招女生。",
    "value": "娱乐只能单考，二取一，第一把指定航天，只招女生。",
    "multiline": false
  },
  {
    "key": "mobile.40",
    "section": "手游考核",
    "label": "小S",
    "value": "小S",
    "multiline": false
  },
  {
    "key": "mobile.41",
    "section": "手游考核",
    "label": "至少熟悉巴克什和航天两张地图，机密进图和考官双排两把，需要熟图且",
    "value": "至少熟悉巴克什和航天两张地图，机密进图和考官双排两把，需要熟图且能够提供情绪价值。",
    "multiline": false
  },
  {
    "key": "mobile.42",
    "section": "手游考核",
    "label": "大S",
    "value": "大S",
    "multiline": false
  },
  {
    "key": "mobile.43",
    "section": "手游考核",
    "label": "在小S要求的基础上，需击杀一人并成功100W撤离，不限制撤离方式",
    "value": "在小S要求的基础上，需击杀一人并成功100W撤离，不限制撤离方式。",
    "multiline": false
  },
  {
    "key": "mobile.44",
    "section": "手游考核",
    "label": "考核费用",
    "value": "考核费用",
    "multiline": false
  },
  {
    "key": "mobile.45",
    "section": "手游考核",
    "label": "30元 / 人 / 次",
    "value": "30元 / 人 / 次",
    "multiline": false
  },
  {
    "key": "mobile.46",
    "section": "手游考核",
    "label": "文考10元 / 次",
    "value": "文考10元 / 次",
    "multiline": false
  },
  {
    "key": "mobile.47",
    "section": "手游考核",
    "label": "服务质量保证金 · 不可单抵",
    "value": "服务质量保证金 · 不可单抵",
    "multiline": false
  },
  {
    "key": "mobile.deposit.fun",
    "section": "手游考核",
    "label": "保证金 · 娱乐",
    "value": "100元",
    "multiline": false
  },
  {
    "key": "mobile.deposit.pro",
    "section": "手游考核",
    "label": "保证金 · PRO",
    "value": "200元",
    "multiline": false
  },
  {
    "key": "mobile.deposit.top",
    "section": "手游考核",
    "label": "保证金 · 顶尖",
    "value": "300元",
    "multiline": false
  },
  {
    "key": "mobile.deposit.demon",
    "section": "手游考核",
    "label": "保证金 · 魔王",
    "value": "500元",
    "multiline": false
  },
  {
    "key": "mobile.49",
    "section": "手游考核",
    "label": "双端设备视频露手考核 · 技术不接受平移",
    "value": "双端设备视频露手考核 · 技术不接受平移",
    "multiline": false
  },
  {
    "key": "mobile.50",
    "section": "手游考核",
    "label": "展开原文",
    "value": "展开原文",
    "multiline": false
  },
  {
    "key": "mobile.51",
    "section": "手游考核",
    "label": "请先阅读左侧考核注意事项，提前准备好设备、账号与考核资金。完整规",
    "value": "请先阅读左侧考核注意事项，提前准备好设备、账号与考核资金。完整规则以对应平台在线原文为准。",
    "multiline": false
  },
  {
    "key": "process.1",
    "section": "报名流程",
    "label": "从报名，到正式加入",
    "value": "从报名，到正式加入",
    "multiline": false
  },
  {
    "key": "process.2",
    "section": "报名流程",
    "label": "01",
    "value": "01",
    "multiline": false
  },
  {
    "key": "process.3",
    "section": "报名流程",
    "label": "加入考核群",
    "value": "加入考核群",
    "multiline": false
  },
  {
    "key": "process.4",
    "section": "报名流程",
    "label": "联系考核分配员",
    "value": "联系考核分配员",
    "multiline": false
  },
  {
    "key": "process.5",
    "section": "报名流程",
    "label": "02",
    "value": "02",
    "multiline": false
  },
  {
    "key": "process.6",
    "section": "报名流程",
    "label": "缴纳考费",
    "value": "缴纳考费",
    "multiline": false
  },
  {
    "key": "process.7",
    "section": "报名流程",
    "label": "由分配员拉考核小群",
    "value": "由分配员拉考核小群",
    "multiline": false
  },
  {
    "key": "process.8",
    "section": "报名流程",
    "label": "03",
    "value": "03",
    "multiline": false
  },
  {
    "key": "process.9",
    "section": "报名流程",
    "label": "参加考核",
    "value": "参加考核",
    "multiline": false
  },
  {
    "key": "process.10",
    "section": "报名流程",
    "label": "按对应平台标准进行",
    "value": "按对应平台标准进行",
    "multiline": false
  },
  {
    "key": "process.11",
    "section": "报名流程",
    "label": "04",
    "value": "04",
    "multiline": false
  },
  {
    "key": "process.12",
    "section": "报名流程",
    "label": "完成入店流程",
    "value": "完成入店流程",
    "multiline": false
  },
  {
    "key": "process.13",
    "section": "报名流程",
    "label": "通过后继续培训与文考",
    "value": "通过后继续培训与文考",
    "multiline": false
  },
  {
    "key": "process.14",
    "section": "报名流程",
    "label": "进店流程原文：考官考核 → 查挂 → 考官培训 → 文考 → 入",
    "value": "进店流程原文：考官考核 → 查挂 → 考官培训 → 文考 → 入职审批 → 拉群",
    "multiline": false
  },
  {
    "key": "process.15",
    "section": "报名流程",
    "label": "考核通过三天内需文考通过，逾期则当轮考核作废，重新参加技术考核。",
    "value": "考核通过三天内需文考通过，逾期则当轮考核作废，重新参加技术考核。",
    "multiline": false
  },
  {
    "key": "notices.1",
    "section": "考核注意事项",
    "label": "栏目标签",
    "value": "考前必读",
    "multiline": false
  },
  {
    "key": "notices.2",
    "section": "考核注意事项",
    "label": "栏目标题",
    "value": "考核注意事项",
    "multiline": false
  },
  {
    "key": "notices.3",
    "section": "考核注意事项",
    "label": "准备提示",
    "value": "请提前准备好设备、账号与资金",
    "multiline": false
  },
  {
    "key": "notices.4",
    "section": "考核注意事项",
    "label": "注意事项 1",
    "value": "任何等级均不得携带除规定以外的所有红弹（偷带红弹一律取消考核成绩）",
    "multiline": true
  },
  {
    "key": "notices.5",
    "section": "考核注意事项",
    "label": "注意事项 2",
    "value": "不能带备头备甲（四听也不能，偷带一律取消考核成绩）",
    "multiline": true
  },
  {
    "key": "notices.6",
    "section": "考核注意事项",
    "label": "注意事项 3",
    "value": "捡到的aw可以用，不能找队友要aw子弹",
    "multiline": true
  },
  {
    "key": "notices.7",
    "section": "考核注意事项",
    "label": "注意事项 4",
    "value": "其中一人死亡，单人物资达到物资要求也算撤离成功1局",
    "multiline": true
  },
  {
    "key": "notices.8",
    "section": "考核注意事项",
    "label": "注意事项 5",
    "value": "只能拉闸、飞升撤离，丢包撤离不算（最后一队不出来，可以拉极限飞升卡闸）",
    "multiline": true
  },
  {
    "key": "notices.9",
    "section": "考核注意事项",
    "label": "注意事项 6",
    "value": "烂崽局、挂局（由考官判断对局强度）一律流局。对局起码三队五套，9把满改枪！！！",
    "multiline": true
  },
  {
    "key": "notices.10",
    "section": "考核注意事项",
    "label": "注意事项 7",
    "value": "对局中出现掉线 / 封号 / 其他个人问题，一律视为失败（务必提前自测账号）",
    "multiline": true
  },
  {
    "key": "notices.11",
    "section": "考核注意事项",
    "label": "注意事项 8",
    "value": "中途禁止更换账号；提前准备好资金充足的账号",
    "multiline": true
  },
  {
    "key": "supervision.1",
    "section": "考核监督",
    "label": "公开考核，认真对待",
    "value": "公开考核，认真对待",
    "multiline": false
  },
  {
    "key": "supervision.2",
    "section": "考核监督",
    "label": "考官考核必须全程开播，抖音号：柒柒游电竞考官xxx。",
    "value": "考官考核必须全程开播，抖音号：柒柒游电竞考官xxx。",
    "multiline": false
  },
  {
    "key": "supervision.3",
    "section": "考核监督",
    "label": "认准唯一收款渠道",
    "value": "认准唯一收款渠道",
    "multiline": false
  },
  {
    "key": "supervision.4",
    "section": "考核监督",
    "label": "柒柒游电竞考核分配员，其余一律为私收费。",
    "value": "柒柒游电竞考核分配员，其余一律为私收费。",
    "multiline": false
  },
  {
    "key": "supervision.5",
    "section": "考核监督",
    "label": "违规举报",
    "value": "违规举报",
    "multiline": false
  },
  {
    "key": "supervision.6",
    "section": "考核监督",
    "label": "统一找总考官钱多多。未开直播、私收费、恶意刁难等，追究并核实成功",
    "value": "统一找总考官钱多多。未开直播、私收费、恶意刁难等，追究并核实成功会有举报奖励。",
    "multiline": false
  },
  {
    "key": "page.title",
    "section": "页面标题",
    "label": "柒柒游电竞在职陪玩管理",
    "value": "柒柒游电竞在职陪玩管理",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.1",
    "section": "页面文案",
    "label": "QIQIYOU ESPORTS",
    "value": "QIQIYOU ESPORTS",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.2",
    "section": "页面文案",
    "label": "/",
    "value": "/",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.3.management",
    "section": "页面文案",
    "label": "在职陪玩管理",
    "value": "在职陪玩管理",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.4",
    "section": "页面文案",
    "label": "查阅考核标准、查看最新通知，扫码联系考官。",
    "value": "查阅考核标准、查看最新通知，扫码联系考官。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.5",
    "section": "页面文案",
    "label": "查看考核标准",
    "value": "查看考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.6",
    "section": "页面文案",
    "label": "加入考核群",
    "value": "加入考核群",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.9",
    "section": "页面文案",
    "label": "查看全部",
    "value": "查看全部",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.10",
    "section": "页面文案",
    "label": "端游 / 手游 / 颜值陪 / 声优陪",
    "value": "端游 / 手游 / 颜值陪 / 声优陪",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.11",
    "section": "页面文案",
    "label": "向下探索",
    "value": "向下探索",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.12.management",
    "section": "页面文案",
    "label": "在职陪玩管理",
    "value": "在职陪玩管理",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.13",
    "section": "页面文案",
    "label": "/",
    "value": "/",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.14",
    "section": "页面文案",
    "label": "导览",
    "value": "导览",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.15",
    "section": "页面文案",
    "label": "常用资料",
    "value": "常用资料",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.16",
    "section": "页面文案",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.17",
    "section": "页面文案",
    "label": "考前须知",
    "value": "考前须知",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.18",
    "section": "页面文案",
    "label": "考核群与考官",
    "value": "考核群与考官",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.20",
    "section": "页面文案",
    "label": "留言板",
    "value": "留言板",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.22",
    "section": "页面文案",
    "label": "正在读取最新内容…",
    "value": "正在读取最新内容…",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.23",
    "section": "页面文案",
    "label": "FAIR PLAY",
    "value": "FAIR PLAY",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.24",
    "section": "页面文案",
    "label": "考核公示与监督",
    "value": "考核公示与监督",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.25",
    "section": "页面文案",
    "label": "全程开播 · 官方收款 · 违规举报",
    "value": "全程开播 · 官方收款 · 违规举报",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.26",
    "section": "页面文案",
    "label": "相关文档",
    "value": "相关文档",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.27",
    "section": "页面文案",
    "label": "考核资料",
    "value": "考核资料",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.28",
    "section": "页面文案",
    "label": "完整文档 · 点击直达",
    "value": "完整文档 · 点击直达",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.29",
    "section": "页面文案",
    "label": "端游考核标准",
    "value": "端游考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.30",
    "section": "页面文案",
    "label": "端游考核规则 · 点击查看",
    "value": "端游考核规则 · 点击查看",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.31",
    "section": "页面文案",
    "label": "手游考核标准",
    "value": "手游考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.32",
    "section": "页面文案",
    "label": "手游考核规则 · 点击查看",
    "value": "手游考核规则 · 点击查看",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.33",
    "section": "页面文案",
    "label": "常用资料与工作入口",
    "value": "常用资料与工作入口",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.34",
    "section": "页面文案",
    "label": "店规 · 接单 · 联系方式",
    "value": "店规 · 接单 · 联系方式",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.35",
    "section": "页面文案",
    "label": "价格表",
    "value": "价格表",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.36",
    "section": "页面文案",
    "label": "查看项目与价格 · 点击打开",
    "value": "查看项目与价格 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.37",
    "section": "页面文案",
    "label": "柒柒游电竞店规",
    "value": "柒柒游电竞店规",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.38",
    "section": "页面文案",
    "label": "入驻与服务规范 · 点击打开",
    "value": "入驻与服务规范 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.39",
    "section": "页面文案",
    "label": "三角洲接单流程规范",
    "value": "三角洲接单流程规范",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.40",
    "section": "页面文案",
    "label": "接单前查阅流程 · 点击打开",
    "value": "接单前查阅流程 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.41",
    "section": "页面文案",
    "label": "客服好友码",
    "value": "客服好友码",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.42",
    "section": "页面文案",
    "label": "添加客服并填写备注 · 点击打开",
    "value": "添加客服并填写备注 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.43",
    "section": "页面文案",
    "label": "柒柒游电竞报单跳单教学",
    "value": "柒柒游电竞报单跳单教学",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.44",
    "section": "页面文案",
    "label": "报单与跳单操作教学 · 点击打开",
    "value": "报单与跳单操作教学 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.45",
    "section": "页面文案",
    "label": "负责人联系表",
    "value": "负责人联系表",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.46",
    "section": "页面文案",
    "label": "查找对应负责人 · 点击打开",
    "value": "查找对应负责人 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.47",
    "section": "页面文案",
    "label": "学员注册登录",
    "value": "学员注册登录",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.48",
    "section": "页面文案",
    "label": "进入学员系统 · 点击打开",
    "value": "进入学员系统 · 点击打开",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.49",
    "section": "页面文案",
    "label": "添加客服提醒",
    "value": "添加客服提醒",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.50",
    "section": "页面文案",
    "label": "请先添加客服，中单后才能及时联系你；添加时记得备注，方便找到你。",
    "value": "请先添加客服，中单后才能及时联系你；添加时记得备注，方便找到你。",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.51",
    "section": "页面文案",
    "label": "端游考核",
    "value": "端游考核",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.52",
    "section": "页面文案",
    "label": "手游考核",
    "value": "手游考核",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.53",
    "section": "页面文案",
    "label": "质检标准",
    "value": "质检标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.54",
    "section": "页面文案",
    "label": "颜值陪 & 声优陪",
    "value": "颜值陪 & 声优陪",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.55",
    "section": "页面文案",
    "label": "单考",
    "value": "单考",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.56",
    "section": "页面文案",
    "label": "双考",
    "value": "双考",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.57",
    "section": "页面文案",
    "label": "娱乐",
    "value": "娱乐",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.58",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.59",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.60",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.61",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.62",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.63",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.64",
    "section": "页面文案",
    "label": "娱乐",
    "value": "娱乐",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.65",
    "section": "页面文案",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.66",
    "section": "页面文案",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.67",
    "section": "页面文案",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.68",
    "section": "页面文案",
    "label": "单考",
    "value": "单考",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.69",
    "section": "页面文案",
    "label": "双考",
    "value": "双考",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.70",
    "section": "页面文案",
    "label": "娱乐",
    "value": "娱乐",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.71",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.72",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.73",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.74",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.75",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.76",
    "section": "页面文案",
    "label": "人",
    "value": "人",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.77",
    "section": "页面文案",
    "label": "娱乐",
    "value": "娱乐",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.78",
    "section": "页面文案",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.79",
    "section": "页面文案",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.80",
    "section": "页面文案",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.82",
    "section": "质检标准",
    "label": "柒柒游电竞质检标准",
    "value": "柒柒游电竞质检标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.83",
    "section": "质检标准",
    "label": "查看在线原文 ↗",
    "value": "查看在线原文 ↗",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.84",
    "section": "质检标准",
    "label": "售后质检：店内质检仅可找质检官进行考核，考核通过保留原等级，考核未通过降级处理。",
    "value": "售后质检：店内质检仅可找质检官进行考核，考核通过保留原等级，考核未通过降级处理。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.85",
    "section": "质检标准",
    "label": "单陪质检",
    "value": "单陪质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.86",
    "section": "质检标准",
    "label": "双陪质检",
    "value": "双陪质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.87",
    "section": "质检标准",
    "label": "单陪质检 · 一共两局",
    "value": "单陪质检 · 一共两局",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.88",
    "section": "质检标准",
    "label": "档位",
    "value": "档位",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.89",
    "section": "质检标准",
    "label": "两局总击杀",
    "value": "两局总击杀",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.90",
    "section": "质检标准",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.91",
    "section": "质检标准",
    "label": "≥ 7",
    "value": "≥ 7",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.92",
    "section": "质检标准",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.93",
    "section": "质检标准",
    "label": "≥ 9",
    "value": "≥ 9",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.94",
    "section": "质检标准",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.95",
    "section": "质检标准",
    "label": "≥ 12",
    "value": "≥ 12",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.96",
    "section": "质检标准",
    "label": "双陪质检 · 一共两局",
    "value": "双陪质检 · 一共两局",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.97",
    "section": "质检标准",
    "label": "档位",
    "value": "档位",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.98",
    "section": "质检标准",
    "label": "两局总击杀",
    "value": "两局总击杀",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.99",
    "section": "质检标准",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.100",
    "section": "质检标准",
    "label": "≥ 12",
    "value": "≥ 12",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.101",
    "section": "质检标准",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.102",
    "section": "质检标准",
    "label": "≥ 16",
    "value": "≥ 16",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.103",
    "section": "质检标准",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.104",
    "section": "质检标准",
    "label": "≥ 20",
    "value": "≥ 20",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.105",
    "section": "质检标准",
    "label": "质检流程",
    "value": "质检流程",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.106",
    "section": "质检标准",
    "label": "售后拉质检考官进群，质检考官先收集信息。",
    "value": "售后拉质检考官进群，质检考官先收集信息。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.107",
    "section": "质检标准",
    "label": "询问售后和打手什么时候开始质检，有的老板需要观看打手质检过程。",
    "value": "询问售后和打手什么时候开始质检，有的老板需要观看打手质检过程。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.108",
    "section": "质检标准",
    "label": "质检前需要告知质检打手要求，质检过程不跟车，可帮忙刷通道卡。",
    "value": "质检前需要告知质检打手要求，质检过程不跟车，可帮忙刷通道卡。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.109",
    "section": "质检标准",
    "label": "质检过程需要开播并且录屏（只录取游戏画面，满足 B 站视频上传要求），需两局一录。",
    "value": "质检过程需要开播并且录屏（只录取游戏画面，满足 B 站视频上传要求），需两局一录。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.110",
    "section": "质检标准",
    "label": "质检结束之后需要在群里发质检结果，并私发售后质检录屏。",
    "value": "质检结束之后需要在群里发质检结果，并私发售后质检录屏。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.111",
    "section": "质检标准",
    "label": "质检要求",
    "value": "质检要求",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.112",
    "section": "质检标准",
    "label": "质检装备要求为刘涛 AW 二选一，禁止备头备甲，禁止步枪连狙红弹，不能故意养猪，烂仔流局。",
    "value": "质检装备要求为刘涛 AW 二选一，禁止备头备甲，禁止步枪连狙红弹，不能故意养猪，烂仔流局。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.123",
    "section": "颜值陪与声优陪",
    "label": "颜值陪 & 声优陪",
    "value": "颜值陪 & 声优陪",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.124",
    "section": "颜值陪与声优陪",
    "label": "查看在线原文 ↗",
    "value": "查看在线原文 ↗",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.125",
    "section": "颜值陪与声优陪",
    "label": "颜值认证",
    "value": "颜值认证",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.128",
    "section": "颜值陪与声优陪",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.129",
    "section": "颜值陪与声优陪",
    "label": "添加考官提交本人生活照、视频等，五官清晰，禁止重度P图。考官打视频验证，照片视频在验证时不",
    "value": "添加考官提交本人生活照、视频等，五官清晰，禁止重度P图。考官打视频验证，照片视频在验证时不能相差过大。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.130",
    "section": "颜值陪与声优陪",
    "label": "必须化妆，可选换装，出镜场景必须光线充足，为颜值认证。",
    "value": "必须化妆，可选换装，出镜场景必须光线充足，为颜值认证。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.131",
    "section": "颜值陪与声优陪",
    "label": "s颜值认证：试音条必须带有自己的真实照片、本人视频。",
    "value": "s颜值认证：试音条必须带有自己的真实照片、本人视频。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.136",
    "section": "颜值陪与声优陪",
    "label": "声优陪 & 歌手",
    "value": "声优陪 & 歌手",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.139",
    "section": "颜值陪与声优陪",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.140",
    "section": "颜值陪与声优陪",
    "label": "添加考官提交本人声线鉴定卡，考官初审试音条，无误即可上添加声线。声线包括：",
    "value": "添加考官提交本人声线鉴定卡，考官初审试音条，无误即可上添加声线。声线包括：",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.141",
    "section": "颜值陪与声优陪",
    "label": "女陪：萝莉、少萝、少女、少御、御姐",
    "value": "女陪：萝莉、少萝、少女、少御、御姐",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.142",
    "section": "颜值陪与声优陪",
    "label": "男陪：小受、青受、青年、青叔、叔音",
    "value": "男陪：小受、青受、青年、青叔、叔音",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.143",
    "section": "颜值陪与声优陪",
    "label": "具有声线的必须要有相对应声线的试音条。",
    "value": "具有声线的必须要有相对应声线的试音条。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.144",
    "section": "颜值陪与声优陪",
    "label": "歌手认证要求麦克风必须清晰，带有声卡，唱歌优美，需列出自己的曲目歌单放在试音条内。",
    "value": "歌手认证要求麦克风必须清晰，带有声卡，唱歌优美，需列出自己的曲目歌单放在试音条内。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.152",
    "section": "页面文案",
    "label": "JOIN THE CLUB",
    "value": "JOIN THE CLUB",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.153",
    "section": "页面文案",
    "label": "加入考核群",
    "value": "加入考核群",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.154",
    "section": "页面文案",
    "label": "选择对应群，扫码报名",
    "value": "选择对应群，扫码报名",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.155",
    "section": "页面文案",
    "label": "群二维码由管理员实时维护",
    "value": "群二维码由管理员实时维护",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.156",
    "section": "页面文案",
    "label": "联系考官",
    "value": "联系考官",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.157",
    "section": "页面文案",
    "label": "选择你的考官",
    "value": "选择你的考官",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.158",
    "section": "页面文案",
    "label": "选择考官后，扫码联系安排考核。",
    "value": "选择考官后，扫码联系安排考核。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.159",
    "section": "页面文案",
    "label": "点击考官姓名，小窗查看二维码",
    "value": "点击考官姓名，小窗查看二维码",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.160",
    "section": "页面文案",
    "label": "需要帮助？联系客服 ↗",
    "value": "需要帮助？联系客服 ↗",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.161",
    "section": "页面文案",
    "label": "CLUB WALL",
    "value": "CLUB WALL",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.162",
    "section": "页面文案",
    "label": "陪玩留言板",
    "value": "陪玩留言板",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.text.163",
    "section": "页面文案",
    "label": "填写名字或编号即可留言，也可选择匿名。留言全员可见。",
    "value": "填写名字或编号即可留言，也可选择匿名。留言全员可见。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "page.text.164",
    "section": "页面文案",
    "label": "最新留言",
    "value": "最新留言",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "page.link.1",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cfsLqC6UObk1",
    "value": "https://www.kdocs.cn/l/cfsLqC6UObk1",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.2",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cqzzQet6d4J8",
    "value": "https://www.kdocs.cn/l/cqzzQet6d4J8",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.3",
    "section": "资料链接",
    "label": "https://www.77uclub.com/price/",
    "value": "https://www.77uclub.com/price/",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.4",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cu1Zp6M79DjO",
    "value": "https://www.kdocs.cn/l/cu1Zp6M79DjO",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.5",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cfeUouOdyXqY",
    "value": "https://www.kdocs.cn/l/cfeUouOdyXqY",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.6",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cocXBc2Xr2TB",
    "value": "https://www.kdocs.cn/l/cocXBc2Xr2TB",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.7",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cavG8VdUwhSw",
    "value": "https://www.kdocs.cn/l/cavG8VdUwhSw",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.8",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cqFdNkjPz5pQ",
    "value": "https://www.kdocs.cn/l/cqFdNkjPz5pQ",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.9",
    "section": "资料链接",
    "label": "http://8.137.176.110:8090/login",
    "value": "http://8.137.176.110:8090/login",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.10",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/cajJ97TkHRt3",
    "value": "https://www.kdocs.cn/l/cajJ97TkHRt3",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "page.link.11",
    "section": "资料链接",
    "label": "https://www.kdocs.cn/l/ch9UcWzF9TmS",
    "value": "https://www.kdocs.cn/l/ch9UcWzF9TmS",
    "multiline": false,
    "kind": "url"
  },
  {
    "key": "talent.section-label",
    "section": "颜值陪与声优陪",
    "label": "考核标准",
    "value": "考核标准",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.after-sales.title",
    "section": "质检标准",
    "label": "售后质检",
    "value": "售后质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.title",
    "section": "质检标准",
    "label": "优先派单群质检",
    "value": "优先派单群质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.intro",
    "section": "质检标准",
    "label": "店内质检仅可找质检官进行考核，考核通过，可加入优先派单群。",
    "value": "店内质检仅可找质检官进行考核，考核通过，可加入优先派单群。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.tab",
    "section": "质检标准",
    "label": "单考质检",
    "value": "单考质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.tab",
    "section": "质检标准",
    "label": "双陪质检",
    "value": "双陪质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.caption",
    "section": "质检标准",
    "label": "单考质检 · 一共两局，看总击杀",
    "value": "单考质检 · 一共两局，看总击杀",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.grade",
    "section": "质检标准",
    "label": "档位",
    "value": "档位",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.kills",
    "section": "质检标准",
    "label": "总击杀",
    "value": "总击杀",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.level.0",
    "section": "质检标准",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.count.0",
    "section": "质检标准",
    "label": "≥ 9",
    "value": "≥ 9",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.level.1",
    "section": "质检标准",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.count.1",
    "section": "质检标准",
    "label": "≥ 11",
    "value": "≥ 11",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.level.2",
    "section": "质检标准",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.single.count.2",
    "section": "质检标准",
    "label": "≥ 14",
    "value": "≥ 14",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.caption",
    "section": "质检标准",
    "label": "双陪质检 · 三取三撤一",
    "value": "双陪质检 · 三取三撤一",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.grade",
    "section": "质检标准",
    "label": "档位",
    "value": "档位",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.kills",
    "section": "质检标准",
    "label": "总击杀",
    "value": "总击杀",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.level.0",
    "section": "质检标准",
    "label": "PRO",
    "value": "PRO",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.count.0",
    "section": "质检标准",
    "label": "≥ 24",
    "value": "≥ 24",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.level.1",
    "section": "质检标准",
    "label": "顶尖",
    "value": "顶尖",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.count.1",
    "section": "质检标准",
    "label": "≥ 28",
    "value": "≥ 28",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.level.2",
    "section": "质检标准",
    "label": "魔王",
    "value": "魔王",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.count.2",
    "section": "质检标准",
    "label": "≥ 33",
    "value": "≥ 33",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.extraction",
    "section": "质检标准",
    "label": "撤离当局物资达到800W（去金红），三局总计人头差不大于5。",
    "value": "撤离当局物资达到800W（去金红），三局总计人头差不大于5。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.double.maps",
    "section": "质检标准",
    "label": "巴克什 +2 人头、监狱 +1 人头计算。",
    "value": "巴克什 +2 人头、监狱 +1 人头计算。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.void.title",
    "section": "质检标准",
    "label": "流局处理",
    "value": "流局处理",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.void.0",
    "section": "质检标准",
    "label": "当场判定被外挂击杀：可流局重开。",
    "value": "当场判定被外挂击杀：可流局重开。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.void.1",
    "section": "质检标准",
    "label": "当局5个及以上的烂崽将会流局。烂崽包括跑刀鼠鼠、五套以下及满改枪玻璃大炮；四听五甲满改枪不",
    "value": "当局5个及以上的烂崽将会流局。烂崽包括跑刀鼠鼠、五套以下及满改枪玻璃大炮；四听五甲满改枪不算烂崽。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.limits.title",
    "section": "质检标准",
    "label": "考核限制",
    "value": "考核限制",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.limits.0",
    "section": "质检标准",
    "label": "无装备使用限制；禁止使用步枪连狙红弹。",
    "value": "无装备使用限制；禁止使用步枪连狙红弹。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.title",
    "section": "质检标准",
    "label": "注意事项",
    "value": "注意事项",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.0",
    "section": "质检标准",
    "label": "任何等级均不得携带除规定以外的所有红弹，偷带红弹一律取消考核成绩。",
    "value": "任何等级均不得携带除规定以外的所有红弹，偷带红弹一律取消考核成绩。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.1",
    "section": "质检标准",
    "label": "不能带备头备甲（四听也不能），偷带一律取消考核成绩。",
    "value": "不能带备头备甲（四听也不能），偷带一律取消考核成绩。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.2",
    "section": "质检标准",
    "label": "捡到的AW可以用，不能找队友要AW子弹。",
    "value": "捡到的AW可以用，不能找队友要AW子弹。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.3",
    "section": "质检标准",
    "label": "不能故意养猪，视情况而定。",
    "value": "不能故意养猪，视情况而定。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.4",
    "section": "质检标准",
    "label": "其中一人死亡，单人物资达到800W也算撤离成功1局。",
    "value": "其中一人死亡，单人物资达到800W也算撤离成功1局。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.5",
    "section": "质检标准",
    "label": "只能拉闸、飞升撤离，丢包撤离不算；最后一队不出来，可以拉极限飞升卡闸。",
    "value": "只能拉闸、飞升撤离，丢包撤离不算；最后一队不出来，可以拉极限飞升卡闸。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.6",
    "section": "质检标准",
    "label": "烂崽局、挂局由考官判断对局强度，一律流局。对局起码三队五套、9把满改枪。",
    "value": "烂崽局、挂局由考官判断对局强度，一律流局。对局起码三队五套、9把满改枪。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.7",
    "section": "质检标准",
    "label": "对局中出现掉线、封号或其他个人问题，一律视为失败，务必提前自测账号。",
    "value": "对局中出现掉线、封号或其他个人问题，一律视为失败，务必提前自测账号。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.notes.8",
    "section": "质检标准",
    "label": "中途禁止更换账号；提前准备好资金充足的账号。",
    "value": "中途禁止更换账号；提前准备好资金充足的账号。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.title",
    "section": "质检标准",
    "label": "质检流程",
    "value": "质检流程",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.0",
    "section": "质检标准",
    "label": "考核全程开播、全程录屏，只录制游戏画面，符合B站上传要求；可三局一录或一局一录。",
    "value": "考核全程开播、全程录屏，只录制游戏画面，符合B站上传要求；可三局一录或一局一录。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.1",
    "section": "质检标准",
    "label": "未开播严禁开展考核。首次未开播违规罚款200元，二次违规罚款500元，三次违规直接取消考官",
    "value": "未开播严禁开展考核。首次未开播违规罚款200元，二次违规罚款500元，三次违规直接取消考官资格。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.2",
    "section": "质检标准",
    "label": "技术考核考生及执行考核的考官，账号段位均需达到钻石及以上。",
    "value": "技术考核考生及执行考核的考官，账号段位均需达到钻石及以上。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.3",
    "section": "质检标准",
    "label": "考官联系考生后拉群，收集信息。",
    "value": "考官联系考生后拉群，收集信息。",
    "multiline": true,
    "kind": "text"
  },
  {
    "key": "quality.public.title",
    "section": "页面文案",
    "label": "优先派单群质检",
    "value": "优先派单群质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.public.description",
    "section": "页面文案",
    "label": "通过质检，可加入优先派单群",
    "value": "通过质检，可加入优先派单群",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.public.nav",
    "section": "页面文案",
    "label": "优先派单群质检",
    "value": "优先派单群质检",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "notices.heading",
    "section": "页面文案",
    "label": "重要通知",
    "value": "重要通知",
    "multiline": false,
    "kind": "text"
  },
  {
    "key": "quality.priority.process.4",
    "section": "质检标准",
    "label": "游戏拉考生进队，考官为队长；开启排位模式，关闭补充队友功能。",
    "value": "游戏拉考生进队，考官为队长；开启排位模式，关闭补充队友功能。",
    "kind": "text",
    "multiline": true
  },
  {
    "key": "quality.priority.process.5",
    "section": "质检标准",
    "label": "考前强调注意事项；每局准备完成后，考生将装备截图发送至考核群，考官逐一核查。双陪按三取三制",
    "value": "考前强调注意事项；每局准备完成后，考生将装备截图发送至考核群，考官逐一核查。双陪按三取三制执行，跟随对局考察操作能力、服务态度、配合及沟通意识。",
    "kind": "text",
    "multiline": true
  },
  {
    "key": "quality.priority.process.6",
    "section": "质检标准",
    "label": "结束后在小群发送考核总结，并将三把战绩截图、一张三把战绩总截图及考核结束总结报备至考官报备",
    "value": "结束后在小群发送考核总结，并将三把战绩截图、一张三把战绩总截图及考核结束总结报备至考官报备群。",
    "kind": "text",
    "multiline": true
  },
  {
    "key": "quality.priority.process.7",
    "section": "质检标准",
    "label": "质检通过入店人员的视频上传B站考官号，永久留档；未通过人员无需留存。",
    "value": "质检通过入店人员的视频上传B站考官号，永久留档；未通过人员无需留存。",
    "kind": "text",
    "multiline": true
  },
  {
    "key": "quality.priority.void.2",
    "section": "质检标准",
    "label": "被外挂淘汰需提交击杀回放供考官审核，审核通过可判流局。单轮考核只能流局一次，两次直接判定考",
    "value": "被外挂淘汰需提交击杀回放供考官审核，审核通过可判流局。单轮考核只能流局一次，两次直接判定考核失败。",
    "kind": "text",
    "multiline": true
  }
]
ASSESSMENT_SCHEMA, true, 512, JSON_THROW_ON_ERROR);
