import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'

type LangPair = 'zh-en' | 'en-zh' | 'zh-ja' | 'ja-zh'

const langLabels: Record<LangPair, { from: string; to: string }> = {
  'zh-en': { from: '中文', to: '英文' },
  'en-zh': { from: '英文', to: '中文' },
  'zh-ja': { from: '中文', to: '日文' },
  'ja-zh': { from: '日文', to: '中文' },
}

const zhEnDict: Record<string, string> = {
  '你好': 'hello', '您好': 'hello', '再见': 'goodbye', '谢谢': 'thank you',
  '感谢': 'thanks', '对不起': 'sorry', '没关系': 'it doesn\'t matter',
  '不客气': 'you\'re welcome', '请': 'please', '是': 'yes',
  '不是': 'no', '好的': 'okay', '也许': 'maybe', '当然': 'of course',
  '早上好': 'good morning', '下午好': 'good afternoon', '晚上好': 'good evening',
  '晚安': 'good night', '欢迎': 'welcome', '再见吧': 'farewell',
  '我': 'I', '你': 'you', '他': 'he', '她': 'she', '它': 'it',
  '我们': 'we', '你们': 'you', '他们': 'they', '她们': 'they',
  '这': 'this', '那': 'that', '这些': 'these', '那些': 'those',
  '谁': 'who', '什么': 'what', '哪里': 'where', '为什么': 'why',
  '怎么': 'how', '多少': 'how much', '几': 'how many', '什么时候': 'when',
  '的': 'of', '了': '', '在': 'at', '有': 'have',
  '和': 'and', '或': 'or', '但是': 'but', '因为': 'because',
  '所以': 'so', '如果': 'if', '虽然': 'although', '而且': 'and also',
  '然后': 'then', '不过': 'however', '还是': 'or',
  '大': 'big', '小': 'small', '多': 'many', '少': 'few',
  '好': 'good', '坏': 'bad', '新': 'new', '旧': 'old',
  '长': 'long', '短': 'short', '高': 'tall', '低': 'low',
  '快': 'fast', '慢': 'slow', '热': 'hot', '冷': 'cold',
  '美丽': 'beautiful', '漂亮': 'pretty', '帅': 'handsome',
  '聪明': 'smart', '笨': 'stupid', '开心': 'happy', '难过': 'sad',
  '生气': 'angry', '害怕': 'afraid', '喜欢': 'like', '爱': 'love',
  '恨': 'hate', '想': 'want to', '知道': 'know', '认为': 'think',
  '希望': 'hope', '相信': 'believe', '需要': 'need', '应该': 'should',
  '可以': 'can', '必须': 'must', '能够': 'be able to',
  '吃': 'eat', '喝': 'drink', '走': 'walk', '跑': 'run',
  '看': 'look', '听': 'listen', '说': 'say', '写': 'write',
  '读': 'read', '学': 'learn', '教': 'teach', '买': 'buy',
  '卖': 'sell', '给': 'give', '拿': 'take', '做': 'do',
  '来': 'come', '去': 'go', '回': 'return', '住': 'live',
  '工作': 'work', '玩': 'play', '睡': 'sleep', '醒': 'wake up',
  '开': 'open', '关': 'close', '坐': 'sit', '站': 'stand',
  '飞': 'fly', '游泳': 'swim', '唱歌': 'sing', '跳舞': 'dance',
  '人': 'person', '男人': 'man', '女人': 'woman', '孩子': 'child',
  '朋友': 'friend', '家': 'home', '家庭': 'family', '父亲': 'father',
  '母亲': 'mother', '儿子': 'son', '女儿': 'daughter', '兄弟': 'brother',
  '姐妹': 'sister', '老师': 'teacher', '学生': 'student', '医生': 'doctor',
  '猫': 'cat', '狗': 'dog', '鸟': 'bird', '鱼': 'fish',
  '花': 'flower', '树': 'tree', '水': 'water', '火': 'fire',
  '山': 'mountain', '河': 'river', '海': 'sea', '天': 'sky',
  '地': 'ground', '风': 'wind', '雨': 'rain', '雪': 'snow',
  '太阳': 'sun', '月亮': 'moon', '星星': 'star', '云': 'cloud',
  '今天': 'today', '明天': 'tomorrow', '昨天': 'yesterday',
  '早上': 'morning', '中午': 'noon', '下午': 'afternoon',
  '晚上': 'evening', '现在': 'now', '以前': 'before', '以后': 'after',
  '年': 'year', '月': 'month', '日': 'day', '星期': 'week',
  '小时': 'hour', '分钟': 'minute', '秒': 'second',
  '一': 'one', '二': 'two', '三': 'three', '四': 'four',
  '五': 'five', '六': 'six', '七': 'seven', '八': 'eight',
  '九': 'nine', '十': 'ten', '百': 'hundred', '千': 'thousand',
  '万': 'ten thousand', '零': 'zero',
  '食物': 'food', '米饭': 'rice', '面条': 'noodles', '面包': 'bread',
  '肉': 'meat', '蔬菜': 'vegetable', '水果': 'fruit', '茶': 'tea',
  '咖啡': 'coffee', '牛奶': 'milk', '酒': 'wine', '啤酒': 'beer',
  '学校': 'school', '医院': 'hospital', '商店': 'shop', '银行': 'bank',
  '机场': 'airport', '车站': 'station', '公园': 'park', '图书馆': 'library',
  '餐厅': 'restaurant', '酒店': 'hotel', '办公室': 'office',
  '电脑': 'computer', '手机': 'mobile phone', '电视': 'television',
  '书': 'book', '笔': 'pen', '桌子': 'desk', '椅子': 'chair',
  '门': 'door', '窗': 'window', '车': 'car', '飞机': 'airplane',
  '火车': 'train', '船': 'ship', '路': 'road', '桥': 'bridge',
  '中国': 'China', '美国': 'America', '英国': 'England', '日本': 'Japan',
  '法国': 'France', '德国': 'Germany', '世界': 'world', '国家': 'country',
  '城市': 'city', '名字': 'name', '电话': 'telephone', '问题': 'question',
  '答案': 'answer', '时间': 'time', '钱': 'money', '生活': 'life',
  '死': 'die', '病': 'illness', '健康': 'health', '快乐': 'happiness',
  '自由': 'freedom', '和平': 'peace', '战争': 'war', '历史': 'history',
  '文化': 'culture', '科学': 'science', '技术': 'technology',
  '音乐': 'music', '电影': 'movie', '艺术': 'art', '运动': 'sport',
  '足球': 'football', '篮球': 'basketball', '颜色': 'color',
  '红色': 'red', '蓝色': 'blue', '绿色': 'green', '黄色': 'yellow',
  '白色': 'white', '黑色': 'black',
  '天气': 'weather', '春天': 'spring', '夏天': 'summer',
  '秋天': 'autumn', '冬天': 'winter',
  '很': 'very', '非常': 'very much', '也': 'also', '都': 'all',
  '就': 'then', '才': 'just', '还': 'still', '又': 'again',
  '已经': 'already', '正在': 'currently', '将要': 'will',
  '曾经': 'once', '刚才': 'just now', '马上': 'immediately',
  '一起': 'together', '永远': 'forever', '总是': 'always',
  '经常': 'often', '有时候': 'sometimes', '从不': 'never',
  '每个': 'every', '一些': 'some', '所有': 'all', '没有': 'not have',
  '不': 'not', '没': 'not', '别': 'don\'t',
  '很棒': 'great', '厉害': 'awesome', '可爱': 'cute',
  '重要': 'important', '简单': 'simple', '困难': 'difficult',
  '安全': 'safe', '危险': 'dangerous', '干净': 'clean', '脏': 'dirty',
  '便宜': 'cheap', '贵': 'expensive', '远': 'far', '近': 'near',
  '左': 'left', '右': 'right', '上': 'up', '下': 'down',
  '前': 'front', '后': 'back', '里面': 'inside', '外面': 'outside',
  '中间': 'middle', '旁边': 'beside',
  '帮助': 'help', '等待': 'wait', '开始': 'start', '结束': 'end',
  '改变': 'change', '发展': 'develop', '提高': 'improve',
  '学习': 'study', '练习': 'practice', '考试': 'exam',
  '旅行': 'travel', '休息': 'rest',
  '生日': 'birthday', '节日': 'festival', '圣诞节': 'Christmas',
  '新年': 'new year', '春节': 'Spring Festival',
  '我爱你': 'I love you', '今天天气真好': 'the weather is really nice today',
  '请稍等': 'please wait a moment', '祝你生日快乐': 'happy birthday to you',
  '你好吗': 'how are you', '我很好': 'I am fine',
  '不好意思': 'excuse me', '请问': 'may I ask',
  '加油': 'come on', '没问题': 'no problem', '恭喜': 'congratulations',
  '辛苦了': 'you\'ve worked hard', '太好了': 'that\'s great',
  '真的吗': 'really', '我不知道': 'I don\'t know',
  '我明白了': 'I understand', '我同意': 'I agree',
  '我不同意': 'I disagree', '随便你': 'up to you',
}

const zhJaDict: Record<string, string> = {
  '你好': 'こんにちは', '您好': 'こんにちは', '再见': 'さようなら',
  '谢谢': 'ありがとう', '对不起': 'ごめんなさい', '没关系': '大丈夫です',
  '不客气': 'どういたしまして', '请': 'お願いします', '是': 'はい',
  '不是': 'いいえ', '好的': 'はい', '也许': 'たぶん',
  '早上好': 'おはようございます', '晚安': 'おやすみなさい',
  '欢迎': 'ようこそ', '我': '私', '你': 'あなた',
  '他': '彼', '她': '彼女', '我们': '私たち', '他们': '彼ら',
  '这': 'これ', '那': 'それ', '什么': '何', '谁': '誰',
  '哪里': 'どこ', '为什么': 'なぜ', '怎么': 'どう',
  '大': '大きい', '小': '小さい', '多': '多い', '少': '少ない',
  '好': '良い', '坏': '悪い', '新': '新しい', '旧': '古い',
  '长': '長い', '短': '短い', '高': '高い', '低': '低い',
  '快': '速い', '慢': '遅い', '热': '暑い', '冷': '寒い',
  '美丽': '美しい', '漂亮': 'きれい', '开心': '嬉しい',
  '难过': '悲しい', '生气': '怒る', '喜欢': '好き', '爱': '愛',
  '吃': '食べる', '喝': '飲む', '走': '歩く', '跑': '走る',
  '看': '見る', '听': '聞く', '说': '言う', '写': '書く',
  '读': '読む', '学': '学ぶ', '买': '買う', '卖': '売る',
  '做': 'する', '来': '来る', '去': '行く', '工作': '仕事',
  '玩': '遊ぶ', '睡': '寝る', '开': '開ける', '关': '閉める',
  '人': '人', '男人': '男', '女人': '女', '孩子': '子供',
  '朋友': '友達', '家': '家', '父亲': '父', '母亲': '母',
  '老师': '先生', '学生': '学生', '医生': '医者',
  '猫': '猫', '狗': '犬', '鸟': '鳥', '鱼': '魚',
  '花': '花', '树': '木', '水': '水', '火': '火',
  '山': '山', '河': '川', '海': '海', '天': '空',
  '风': '風', '雨': '雨', '雪': '雪', '太阳': '太陽',
  '月亮': '月', '星': '星', '云': '雲',
  '今天': '今日', '明天': '明日', '昨天': '昨日',
  '早上': '朝', '晚上': '夜', '现在': '今',
  '年': '年', '月': '月', '日': '日',
  '一': '一', '二': '二', '三': '三', '四': '四',
  '五': '五', '六': '六', '七': '七', '八': '八',
  '九': '九', '十': '十', '百': '百', '千': '千',
  '食物': '食べ物', '米饭': 'ご飯', '面条': '麺', '面包': 'パン',
  '肉': '肉', '茶': 'お茶', '咖啡': 'コーヒー', '牛奶': '牛乳',
  '学校': '学校', '医院': '病院', '商店': '店', '银行': '銀行',
  '公园': '公園', '图书馆': '図書館', '餐厅': 'レストラン',
  '电脑': 'コンピュータ', '手机': '携帯電話', '电视': 'テレビ',
  '书': '本', '车': '車', '飞机': '飛行機', '火车': '電車',
  '中国': '中国', '美国': 'アメリカ', '日本': '日本',
  '世界': '世界', '国家': '国', '城市': '都市',
  '名字': '名前', '电话': '電話', '问题': '問題',
  '时间': '時間', '钱': 'お金', '生活': '生活',
  '健康': '健康', '快乐': '幸せ', '自由': '自由',
  '和平': '平和', '历史': '歴史', '文化': '文化',
  '科学': '科学', '技术': '技術', '音乐': '音楽',
  '电影': '映画', '艺术': '芸術', '运动': 'スポーツ',
  '颜色': '色', '红色': '赤', '蓝色': '青', '绿色': '緑',
  '白色': '白', '黑色': '黒',
  '天气': '天気', '春天': '春', '夏天': '夏',
  '秋天': '秋', '冬天': '冬',
  '很': 'とても', '也': 'も', '都': 'すべて', '不': 'ない',
  '已经': 'すでに', '正在': '〜ている', '将要': '〜つもり',
  '一起': '一緒に', '总是': 'いつも', '经常': 'よく',
  '有时候': '時々', '每个': '毎', '一些': 'いくつか',
  '重要': '重要', '简单': '簡単', '困难': '難しい',
  '安全': '安全', '危险': '危険', '便宜': '安い', '贵': '高い',
  '远': '遠い', '近': '近い', '帮助': '助ける',
  '等待': '待つ', '开始': '始める', '结束': '終わる',
  '学习': '勉強する', '旅行': '旅行', '生日': '誕生日',
  '我爱你': '愛してる', '你好吗': 'お元気ですか',
  '我很好': '元気です', '加油': '頑張って',
  '没问题': '問題ありません', '恭喜': 'おめでとう',
}

const singleCharZhEn: Record<string, string> = {
  '人': 'person', '大': 'big', '小': 'small', '中': 'middle',
  '上': 'up', '下': 'down', '左': 'left', '右': 'right',
  '前': 'front', '后': 'back', '内': 'inner', '外': 'outer',
  '东': 'east', '西': 'west', '南': 'south', '北': 'north',
  '金': 'gold', '木': 'wood', '水': 'water', '火': 'fire',
  '土': 'earth', '日': 'sun', '月': 'moon', '星': 'star',
  '天': 'sky', '地': 'ground', '山': 'mountain', '石': 'stone',
  '风': 'wind', '雨': 'rain', '雪': 'snow', '云': 'cloud',
  '花': 'flower', '草': 'grass', '树': 'tree', '叶': 'leaf',
  '鱼': 'fish', '鸟': 'bird', '马': 'horse', '牛': 'cow',
  '羊': 'sheep', '猪': 'pig', '鸡': 'chicken', '龙': 'dragon',
  '蛇': 'snake', '鼠': 'mouse', '虎': 'tiger', '兔': 'rabbit',
  '心': 'heart', '手': 'hand', '头': 'head', '足': 'foot',
  '口': 'mouth', '目': 'eye', '耳': 'ear', '鼻': 'nose',
  '力': 'power', '气': 'air', '光': 'light', '影': 'shadow',
  '声': 'sound', '色': 'color', '味': 'taste', '香': 'fragrance',
  '甜': 'sweet', '苦': 'bitter', '酸': 'sour', '辣': 'spicy',
  '冷': 'cold', '暖': 'warm', '明': 'bright', '暗': 'dark',
  '快': 'fast', '慢': 'slow', '新': 'new', '旧': 'old',
  '好': 'good', '坏': 'bad', '美': 'beautiful', '丑': 'ugly',
  '真': 'true', '假': 'false', '善': 'kind', '恶': 'evil',
  '爱': 'love', '恨': 'hate', '喜': 'joy', '怒': 'anger',
  '哀': 'sorrow', '乐': 'happiness', '思': 'think', '念': 'miss',
  '信': 'trust', '望': 'hope', '梦': 'dream', '想': 'think',
  '知': 'know', '见': 'see', '闻': 'hear', '言': 'speak',
  '行': 'go', '立': 'stand', '坐': 'sit', '卧': 'lie',
  '食': 'eat', '饮': 'drink', '衣': 'clothes', '住': 'live',
  '学': 'learn', '教': 'teach', '读': 'read', '写': 'write',
  '买': 'buy', '卖': 'sell', '开': 'open', '关': 'close',
  '给': 'give', '取': 'take', '送': 'send', '收': 'receive',
  '生': 'life', '死': 'death', '老': 'old', '少': 'young',
  '男': 'male', '女': 'female', '父': 'father', '母': 'mother',
  '子': 'son', '兄': 'brother', '弟': 'younger brother',
  '友': 'friend', '敌': 'enemy', '王': 'king', '民': 'people',
  '国': 'country', '家': 'home', '城': 'city', '村': 'village',
  '路': 'road', '桥': 'bridge', '门': 'door', '窗': 'window',
  '车': 'car', '船': 'ship', '刀': 'knife', '剑': 'sword',
  '书': 'book', '笔': 'pen', '纸': 'paper', '墨': 'ink',
  '琴': 'lute', '棋': 'chess', '画': 'painting', '诗': 'poem',
  '酒': 'wine', '茶': 'tea', '饭': 'rice', '菜': 'dish',
  '果': 'fruit', '糖': 'sugar', '盐': 'salt', '米': 'rice',
  '面': 'face', '丝': 'silk', '玉': 'jade', '宝': 'treasure',
  '钱': 'money', '银': 'silver', '铁': 'iron', '钢': 'steel',
  '红': 'red', '绿': 'green', '蓝': 'blue', '白': 'white',
  '黑': 'black', '黄': 'yellow', '紫': 'purple', '灰': 'gray',
  '春': 'spring', '夏': 'summer', '秋': 'autumn', '冬': 'winter',
  '今': 'now', '古': 'ancient', '始': 'begin', '终': 'end',
  '进': 'enter', '出': 'exit', '来': 'come', '去': 'go',
  '高': 'tall', '低': 'low', '长': 'long', '短': 'short',
  '厚': 'thick', '薄': 'thin', '宽': 'wide', '窄': 'narrow',
  '深': 'deep', '浅': 'shallow', '重': 'heavy', '轻': 'light',
  '硬': 'hard', '软': 'soft', '干': 'dry', '湿': 'wet',
  '净': 'clean', '脏': 'dirty', '安': 'safe', '危': 'danger',
  '富': 'rich', '穷': 'poor', '贵': 'expensive', '廉': 'cheap',
  '强': 'strong', '弱': 'weak', '勇': 'brave', '怯': 'timid',
  '智': 'wisdom', '愚': 'foolish', '诚': 'honest', '伪': 'fake',
  '正': 'right', '邪': 'evil', '公': 'public', '私': 'private',
  '阴': 'yin', '阳': 'yang', '虚': 'empty', '实': 'solid',
  '静': 'quiet', '动': 'move', '分': 'divide', '合': 'combine',
  '战': 'war', '和': 'peace', '胜': 'win', '败': 'lose',
  '成': 'success', '兴': 'rise', '衰': 'decline',
  '治': 'govern', '乱': 'chaos', '荣': 'glory', '辱': 'shame',
}

const enAffixes: Record<string, string> = {
  'un': '不', 'in': '不', 'im': '不', 'ir': '不', 'il': '不',
  'dis': '否定', 'mis': '错误', 'non': '非', 'anti': '反',
  'pre': '前', 'post': '后', 're': '再', 'over': '过度',
  'under': '不足', 'out': '外', 'sub': '下', 'super': '超',
  'inter': '相互', 'trans': '跨', 'ex': '前', 'fore': '预先',
  'self': '自我', 'semi': '半', 'bi': '双', 'tri': '三',
  'multi': '多', 'auto': '自动', 'co': '共同', 'counter': '反',
  'de': '去除', 'en': '使', 'em': '使', 'up': '上',
  'ing': '进行中', 'ed': '已', 'er': '者', 'or': '者',
  'tion': '行为', 'sion': '行为', 'ment': '行为', 'ness': '性质',
  'ity': '性质', 'ful': '充满', 'less': '无', 'ous': '的',
  'ive': '的', 'al': '的', 'ial': '的', 'ical': '的',
  'able': '能够', 'ible': '能够', 'ly': '地', 'ward': '方向',
  'ize': '化', 'ise': '化', 'fy': '化',
  'dom': '领域', 'ship': '关系', 'hood': '身份', 'ism': '主义',
  'ist': '主义者', 'ure': '行为', 'age': '集合', 'ery': '场所',
}

const enZhDict: Record<string, string> = {}
for (const [zh, en] of Object.entries(zhEnDict)) {
  if (en && en.trim()) {
    const key = en.toLowerCase()
    if (!enZhDict[key] || zh.length > enZhDict[key].length) {
      enZhDict[key] = zh
    }
  }
}

const jaZhDict: Record<string, string> = {}
for (const [zh, ja] of Object.entries(zhJaDict)) {
  if (ja && ja.trim()) {
    const key = ja
    if (!jaZhDict[key] || zh.length > jaZhDict[key].length) {
      jaZhDict[key] = zh
    }
  }
}

function segmentChinese(text: string, dict: Record<string, string>): string[] {
  const keys = Object.keys(dict).sort((a, b) => b.length - a.length)
  const results: string[] = []
  let i = 0
  while (i < text.length) {
    let matched = false
    for (const key of keys) {
      if (text.substring(i, i + key.length) === key) {
        results.push(key)
        i += key.length
        matched = true
        break
      }
    }
    if (!matched) {
      results.push(text[i])
      i++
    }
  }
  return results
}

function segmentEnglish(text: string): string[] {
  const tokens: string[] = []
  const words = text.split(/(\s+|[.,!?;:'"()\[\]{}])/)
  for (const w of words) {
    if (w.trim()) tokens.push(w)
  }
  return tokens
}

function isChineseChar(ch: string): boolean {
  const code = ch.charCodeAt(0)
  return code >= 0x4e00 && code <= 0x9fff
}

function fallbackZhToEn(char: string): string {
  if (singleCharZhEn[char]) return singleCharZhEn[char]
  if (isChineseChar(char)) return `[${char}]`
  return char
}

function fallbackEnToZh(word: string): string {
  const lower = word.toLowerCase()
  for (const [affix, meaning] of Object.entries(enAffixes)) {
    if (lower.startsWith(affix) && lower.length > affix.length) {
      return meaning + fallbackEnToZh(lower.slice(affix.length))
    }
    if (lower.endsWith(affix) && lower.length > affix.length) {
      return fallbackEnToZh(lower.slice(0, -affix.length)) + meaning
    }
  }
  return `[${word}]`
}

function translateZhToEn(text: string): string {
  const segments = segmentChinese(text, zhEnDict)
  const words: string[] = []
  for (const seg of segments) {
    if (zhEnDict[seg] !== undefined) {
      if (zhEnDict[seg]) words.push(zhEnDict[seg])
    } else if (seg.length === 1 && isChineseChar(seg)) {
      const fb = fallbackZhToEn(seg)
      if (fb) words.push(fb)
    } else {
      const fb = fallbackZhToEn(seg)
      if (fb) words.push(fb)
    }
  }
  let result = words.join(' ')
  result = result.replace(/\s+/g, ' ').trim()
  result = adjustZhEnOrder(result)
  return capitalizeFirst(result)
}

function translateEnToZh(text: string): string {
  const tokens = segmentEnglish(text)
  const words: string[] = []
  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (enZhDict[lower]) {
      words.push(enZhDict[lower])
    } else if (/^[.,!?;:'"()\[\]{}]$/.test(token)) {
      words.push(token)
    } else if (/^[a-zA-Z]/.test(token)) {
      words.push(fallbackEnToZh(token))
    } else {
      words.push(token)
    }
  }
  let result = words.join('')
  result = adjustEnZhOrder(result)
  return result
}

function translateZhToJa(text: string): string {
  const segments = segmentChinese(text, zhJaDict)
  const words: string[] = []
  for (const seg of segments) {
    if (zhJaDict[seg]) {
      words.push(zhJaDict[seg])
    } else if (seg.length === 1 && isChineseChar(seg)) {
      words.push(seg)
    } else {
      words.push(seg)
    }
  }
  return words.join('')
}

function translateJaToZh(text: string): string {
  const segments: string[] = []
  const jaKeys = Object.keys(jaZhDict).sort((a, b) => b.length - a.length)
  let i = 0
  while (i < text.length) {
    let matched = false
    for (const key of jaKeys) {
      if (text.substring(i, i + key.length) === key) {
        segments.push(key)
        i += key.length
        matched = true
        break
      }
    }
    if (!matched) {
      segments.push(text[i])
      i++
    }
  }
  const words: string[] = []
  for (const seg of segments) {
    if (jaZhDict[seg]) {
      words.push(jaZhDict[seg])
    } else {
      words.push(seg)
    }
  }
  return words.join('')
}

function adjustZhEnOrder(result: string): string {
  let adjusted = result
  const timePatterns: [RegExp, string][] = [
    [/^today\s+(.+)/i, '$1 today'],
    [/^yesterday\s+(.+)/i, '$1 yesterday'],
    [/^tomorrow\s+(.+)/i, '$1 tomorrow'],
    [/^now\s+(.+)/i, '$1 now'],
  ]
  for (const [pattern, replacement] of timePatterns) {
    if (pattern.test(adjusted)) {
      adjusted = adjusted.replace(pattern, replacement)
      break
    }
  }
  if (/^(what|who|where|when|why|how)\b/i.test(adjusted)) {
    if (!adjusted.endsWith('?')) adjusted += '?'
  }
  return adjusted
}

function adjustEnZhOrder(result: string): string {
  let adjusted = result
  adjusted = adjusted.replace(/不不/g, '不')
  return adjusted
}

function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function doTranslate(text: string, langPair: LangPair): string {
  if (!text.trim()) return ''
  switch (langPair) {
    case 'zh-en': return translateZhToEn(text.trim())
    case 'en-zh': return translateEnToZh(text.trim())
    case 'zh-ja': return translateZhToJa(text.trim())
    case 'ja-zh': return translateJaToZh(text.trim())
    default: return text
  }
}

interface HistoryItem {
  id: number
  input: string
  result: string
  langPair: LangPair
  time: string
}

export default function Translator() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [langPair, setLangPair] = useState<LangPair>('zh-en')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const historyIdRef = useRef(0)
  const lastTranslatedRef = useRef('')

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'
  const mutedColor = isDark ? '#6b7280' : '#bbb'
  const historyBg = isDark ? '#0d1b2a' : '#f0f0f0'

  useEffect(() => {
    if (!input.trim()) {
      setResult('')
      return
    }
    const translated = doTranslate(input, langPair)
    setResult(translated)
  }, [input, langPair])

  const addToHistory = () => {
    if (!input.trim() || !result.trim()) return
    if (input.trim() === lastTranslatedRef.current) return
    lastTranslatedRef.current = input.trim()
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    const item: HistoryItem = {
      id: ++historyIdRef.current,
      input: input.trim(),
      result: result.trim(),
      langPair,
      time: timeStr,
    }
    setHistory(prev => [item, ...prev].slice(0, 50))
  }

  const swapLangs = () => {
    const swaps: Record<LangPair, LangPair> = {
      'zh-en': 'en-zh',
      'en-zh': 'zh-en',
      'zh-ja': 'ja-zh',
      'ja-zh': 'zh-ja',
    }
    setLangPair(swaps[langPair])
    setResult('')
  }

  const copyResult = async () => {
    if (!result) return
    addToHistory()
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadHistoryItem = (item: HistoryItem) => {
    setLangPair(item.langPair)
    setInput(item.input)
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].from}</span>
        <select value={langPair} onChange={(e) => { setLangPair(e.target.value as LangPair); setResult('') }}
          style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, outline: 'none' }}>
          <option value="zh-en">中文 → 英文</option>
          <option value="en-zh">英文 → 中文</option>
          <option value="zh-ja">中文 → 日文</option>
          <option value="ja-zh">日文 → 中文</option>
        </select>
        <button onClick={swapLangs} style={{
          width: 32, height: 32, borderRadius: '50%', border: `1px solid ${borderColor}`,
          background: inputBg, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>⇄</button>
        <span style={{ fontWeight: 500, fontSize: 14 }}>{langLabels[langPair].to}</span>
        <button onClick={() => setShowHistory(!showHistory)} title="翻译历史" style={{
          marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, border: `1px solid ${borderColor}`,
          background: showHistory ? accent : inputBg, color: showHistory ? '#fff' : textColor,
          cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
        }}>📋 历史{history.length > 0 ? `(${history.length})` : ''}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', padding: 12, gap: 12, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={`输入${langLabels[langPair].from}文本，实时翻译...`}
            style={{
              flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${borderColor}`,
              background: inputBg, color: textColor, fontSize: 14, lineHeight: 1.8,
              resize: 'none', outline: 'none', fontFamily: 'system-ui, sans-serif',
            }}
          />
          <div style={{ marginTop: 4, fontSize: 11, color: mutedColor, textAlign: 'right' }}>
            {input.length > 0 ? `${input.length} 字符` : ''}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${borderColor}`,
            background: inputBg, fontSize: 14, lineHeight: 1.8, overflow: 'auto', position: 'relative',
          }}>
            {result ? (
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</div>
            ) : (
              <div style={{ color: mutedColor }}>翻译结果将实时显示在这里</div>
            )}
          </div>
          {result && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={copyResult} style={{
                flex: 1, padding: '8px 16px', borderRadius: 6, border: `1px solid ${borderColor}`,
                background: copied ? (isDark ? '#1a4a1a' : '#c8e6c9') : inputBg,
                color: copied ? '#4caf50' : textColor, cursor: 'pointer', fontSize: 12,
              }}>
                {copied ? '✓ 已复制' : '📋 复制结果'}
              </button>
              <button onClick={addToHistory} style={{
                padding: '8px 16px', borderRadius: 6, border: `1px solid ${borderColor}`,
                background: inputBg, color: textColor, cursor: 'pointer', fontSize: 12,
              }}>💾 保存</button>
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div style={{
          maxHeight: '40%', borderTop: `1px solid ${borderColor}`,
          background: historyBg, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${borderColor}` }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>翻译历史</span>
            {history.length > 0 && (
              <button onClick={clearHistory} style={{
                marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, border: `1px solid ${borderColor}`,
                background: inputBg, color: textColor, cursor: 'pointer', fontSize: 11,
              }}>清空</button>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
            {history.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: mutedColor, fontSize: 12 }}>
                暂无翻译历史，点击"保存"按钮添加记录
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} onClick={() => loadHistoryItem(item)} style={{
                  padding: '6px 16px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1a2a4a' : '#e8e8e8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 10, color: mutedColor, flexShrink: 0 }}>{item.time}</span>
                  <span style={{ fontSize: 11, color: accent, flexShrink: 0 }}>
                    {langLabels[item.langPair].from}→{langLabels[item.langPair].to}
                  </span>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {item.input}
                  </span>
                  <span style={{ fontSize: 12, color: mutedColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                    → {item.result}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
