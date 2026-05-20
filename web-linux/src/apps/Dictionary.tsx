import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { VolumeIcon } from '../icons'

interface DictEntry {
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  example: string
  exampleZh: string
  etymology: string
}

const dictionary: DictEntry[] = [
  { word: 'abandon', phonetic: '/əˈbændən/', partOfSpeech: 'v.', definition: '放弃；抛弃；遗弃', example: 'He abandoned his plan to travel.', exampleZh: '他放弃了旅行的计划。', etymology: '源自古法语 abandoner，由 a- + bandon（控制权）构成' },
  { word: 'abide', phonetic: '/əˈbaɪd/', partOfSpeech: 'v.', definition: '遵守；忍受；停留', example: 'We must abide by the rules.', exampleZh: '我们必须遵守规则。', etymology: '古英语 ābīdan，由 ā- + bīdan（等待）构成' },
  { word: 'abrupt', phonetic: '/əˈbrʌpt/', partOfSpeech: 'adj.', definition: '突然的；唐突的；陡峭的', example: 'The road ended in an abrupt cliff.', exampleZh: '道路突然终止于悬崖。', etymology: '拉丁语 abruptus，ab- + rumpere（断裂）' },
  { word: 'absorb', phonetic: '/əbˈzɔːrb/', partOfSpeech: 'v.', definition: '吸收；吸引；使全神贯注', example: 'The sponge absorbs water quickly.', exampleZh: '海绵很快吸收水分。', etymology: '拉丁语 absorbere，ab- + sorbere（吸入）' },
  { word: 'abstract', phonetic: '/ˈæbstrækt/', partOfSpeech: 'adj./n.', definition: '抽象的；摘要；提取', example: 'The concept is too abstract for children.', exampleZh: '这个概念对孩子来说太抽象了。', etymology: '拉丁语 abstractus，abstrahere（拉开）的过去分词' },
  { word: 'abundant', phonetic: '/əˈbʌndənt/', partOfSpeech: 'adj.', definition: '丰富的；充裕的；大量的', example: 'The region has abundant natural resources.', exampleZh: '该地区有丰富的自然资源。', etymology: '拉丁语 abundans，abundare（溢出）的现在分词' },
  { word: 'accelerate', phonetic: '/əkˈseləreɪt/', partOfSpeech: 'v.', definition: '加速；促进；增加', example: 'The car accelerated rapidly.', exampleZh: '汽车迅速加速。', etymology: '拉丁语 accelerare，ad- + celer（快的）' },
  { word: 'accommodate', phonetic: '/əˈkɒmədeɪt/', partOfSpeech: 'v.', definition: '容纳；适应；提供住宿', example: 'The hall can accommodate 500 people.', exampleZh: '大厅可容纳500人。', etymology: '拉丁语 accommodare，ad- + commodus（合适的）' },
  { word: 'accomplish', phonetic: '/əˈkɒmplɪʃ/', partOfSpeech: 'v.', definition: '完成；实现；达到', example: 'She accomplished all her goals.', exampleZh: '她实现了所有目标。', etymology: '拉丁语 accompletare，ad- + complere（填满）' },
  { word: 'accumulate', phonetic: '/əˈkjuːmjəleɪt/', partOfSpeech: 'v.', definition: '积累；积聚；堆积', example: 'Dust accumulates on the shelves.', exampleZh: '灰尘积聚在书架上。', etymology: '拉丁语 accumulare，ad- + cumulus（堆）' },
  { word: 'accurate', phonetic: '/ˈækjərət/', partOfSpeech: 'adj.', definition: '准确的；精确的', example: 'The data must be accurate.', exampleZh: '数据必须准确。', etymology: '拉丁语 accuratus，过去分词 of accurare（细心处理）' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', partOfSpeech: 'v.', definition: '实现；达到；取得', example: 'She achieved great success.', exampleZh: '她取得了巨大成功。', etymology: '古法语 achever，来自通俗拉丁语 *accapāre' },
  { word: 'acknowledge', phonetic: '/əkˈnɒlɪdʒ/', partOfSpeech: 'v.', definition: '承认；确认；感谢', example: 'He acknowledged his mistake.', exampleZh: '他承认了自己的错误。', etymology: '中古英语 acknowledge，前缀 a- + knowledge' },
  { word: 'acquire', phonetic: '/əˈkwaɪər/', partOfSpeech: 'v.', definition: '获得；习得；收购', example: 'She acquired a taste for jazz.', exampleZh: '她培养了对爵士乐的品味。', etymology: '拉丁语 acquirere，ad- + quaerere（寻求）' },
  { word: 'adapt', phonetic: '/əˈdæpt/', partOfSpeech: 'v.', definition: '适应；改编；调整', example: 'Animals adapt to their environment.', exampleZh: '动物适应其环境。', etymology: '拉丁语 adaptare，ad- + aptare（使适合）' },
  { word: 'adequate', phonetic: '/ˈædɪkwət/', partOfSpeech: 'adj.', definition: '足够的；适当的；合格的', example: 'The supply is adequate for the demand.', exampleZh: '供应满足需求。', etymology: '拉丁语 adaequatus，adaequare（使相等）' },
  { word: 'adhere', phonetic: '/ədˈhɪər/', partOfSpeech: 'v.', definition: '坚持；粘附；追随', example: 'We must adhere to the schedule.', exampleZh: '我们必须坚持时间表。', etymology: '拉丁语 adhaerere，ad- + haerere（粘住）' },
  { word: 'adjacent', phonetic: '/əˈdʒeɪsnt/', partOfSpeech: 'adj.', definition: '邻近的；毗连的', example: 'The two buildings are adjacent.', exampleZh: '两栋建筑相邻。', etymology: '拉丁语 adjacere（靠近）的现在分词' },
  { word: 'admire', phonetic: '/ədˈmaɪər/', partOfSpeech: 'v.', definition: '钦佩；赞赏；欣赏', example: 'I admire her courage.', exampleZh: '我钦佩她的勇气。', etymology: '拉丁语 admirari，ad- + mirari（惊叹）' },
  { word: 'advent', phonetic: '/ˈædvent/', partOfSpeech: 'n.', definition: '到来；出现；降临', example: 'The advent of the internet changed everything.', exampleZh: '互联网的出现改变了一切。', etymology: '拉丁语 adventus，advenire（到来）的过去分词' },
  { word: 'adverse', phonetic: '/ˈædvɜːrs/', partOfSpeech: 'adj.', definition: '不利的；有害的；相反的', example: 'Adverse weather conditions delayed the flight.', exampleZh: '恶劣天气延误了航班。', etymology: '拉丁语 adversus，advertere（转向）的过去分词' },
  { word: 'advocate', phonetic: '/ˈædvəkeɪt/', partOfSpeech: 'v./n.', definition: '提倡；拥护者；辩护者', example: 'She advocates for human rights.', exampleZh: '她倡导人权。', etymology: '拉丁语 advocare，ad- + vocare（呼叫）' },
  { word: 'aesthetic', phonetic: '/iːsˈθetɪk/', partOfSpeech: 'adj.', definition: '审美的；美学的；雅致的', example: 'The building has great aesthetic appeal.', exampleZh: '这座建筑有很大的审美吸引力。', etymology: '希腊语 aisthētikos（感知的）' },
  { word: 'affirm', phonetic: '/əˈfɜːrm/', partOfSpeech: 'v.', definition: '断言；肯定；证实', example: 'He affirmed his commitment to the project.', exampleZh: '他确认了对项目的承诺。', etymology: '拉丁语 affirmare，ad- + firmare（加强）' },
  { word: 'aggravate', phonetic: '/ˈæɡrəveɪt/', partOfSpeech: 'v.', definition: '加重；恶化；激怒', example: 'The cold weather aggravated his cough.', exampleZh: '寒冷天气加重了他的咳嗽。', etymology: '拉丁语 aggravare，ad- + gravis（重的）' },
  { word: 'alleviate', phonetic: '/əˈliːvieɪt/', partOfSpeech: 'v.', definition: '减轻；缓和；缓解', example: 'Medicine can alleviate the pain.', exampleZh: '药物可以缓解疼痛。', etymology: '拉丁语 alleviare，ad- + levis（轻的）' },
  { word: 'ambiguous', phonetic: '/æmˈbɪɡjuəs/', partOfSpeech: 'adj.', definition: '模棱两可的；含糊的', example: 'His answer was deliberately ambiguous.', exampleZh: '他的回答故意含糊不清。', etymology: '拉丁语 ambiguus，amb- + agere（驱动）' },
  { word: 'amend', phonetic: '/əˈmend/', partOfSpeech: 'v.', definition: '修正；修改；改正', example: 'The bill was amended several times.', exampleZh: '该法案被修改了多次。', etymology: '拉丁语 emendare，e- + mendum（过错）' },
  { word: 'ample', phonetic: '/ˈæmpl/', partOfSpeech: 'adj.', definition: '充足的；丰富的；宽敞的', example: 'There is ample evidence to support the claim.', exampleZh: '有充足的证据支持这一主张。', etymology: '拉丁语 amplus（大的，宽敞的）' },
  { word: 'analogy', phonetic: '/əˈnælədʒi/', partOfSpeech: 'n.', definition: '类比；类推；相似', example: 'He drew an analogy between life and a journey.', exampleZh: '他把人生比作旅途。', etymology: '希腊语 analogia（比例）' },
  { word: 'anomaly', phonetic: '/əˈnɒməli/', partOfSpeech: 'n.', definition: '异常；反常现象；不规则', example: 'Scientists detected an anomaly in the data.', exampleZh: '科学家在数据中发现了异常。', etymology: '希腊语 anōmalia（不规则）' },
  { word: 'anticipate', phonetic: '/ænˈtɪsɪpeɪt/', partOfSpeech: 'v.', definition: '预期；预料；期望', example: 'We anticipate a busy holiday season.', exampleZh: '我们预期假期会很忙。', etymology: '拉丁语 anticipare，ante- + capere（取）' },
  { word: 'apparent', phonetic: '/əˈpærənt/', partOfSpeech: 'adj.', definition: '明显的；表面上的；显然的', example: 'The difference was apparent to everyone.', exampleZh: '差异对每个人来说都很明显。', etymology: '拉丁语 apparens，apparere（出现）的现在分词' },
  { word: 'appease', phonetic: '/əˈpiːz/', partOfSpeech: 'v.', definition: '安抚；平息；满足', example: 'They tried to appease the angry crowd.', exampleZh: '他们试图安抚愤怒的人群。', etymology: '古法语 apaisier，a- + pais（和平）' },
  { word: 'apprehend', phonetic: '/ˌæprɪˈhend/', partOfSpeech: 'v.', definition: '理解；逮捕；忧虑', example: 'She could not apprehend the meaning.', exampleZh: '她无法理解其含义。', etymology: '拉丁语 apprehendere，ad- + prehendere（抓住）' },
  { word: 'arbitrary', phonetic: '/ˈɑːrbɪtreri/', partOfSpeech: 'adj.', definition: '任意的；武断的；专制的', example: 'The decision seemed arbitrary.', exampleZh: '这个决定似乎是武断的。', etymology: '拉丁语 arbitrarius，来自 arbiter（仲裁者）' },
  { word: 'articulate', phonetic: '/ɑːrˈtɪkjəleɪt/', partOfSpeech: 'adj./v.', definition: '清晰表达的；明确表述；连接', example: 'She articulated her ideas clearly.', exampleZh: '她清晰地表达了她的想法。', etymology: '拉丁语 articulatus，articulus（关节）' },
  { word: 'ascend', phonetic: '/əˈsend/', partOfSpeech: 'v.', definition: '上升；攀登；追溯', example: 'The hikers ascended the mountain.', exampleZh: '登山者攀登了这座山。', etymology: '拉丁语 ascendere，ad- + scandere（攀登）' },
  { word: 'aspire', phonetic: '/əˈspaɪər/', partOfSpeech: 'v.', definition: '渴望；追求；立志', example: 'She aspires to become a doctor.', exampleZh: '她立志成为一名医生。', etymology: '拉丁语 aspirare，ad- + spirare（呼吸）' },
  { word: 'assault', phonetic: '/əˈsɔːlt/', partOfSpeech: 'n./v.', definition: '攻击；袭击；侵犯', example: 'The assault occurred at midnight.', exampleZh: '袭击发生在午夜。', etymology: '古法语 asaut，拉丁语 adsaltus（跳跃）' },
  { word: 'assimilate', phonetic: '/əˈsɪməleɪt/', partOfSpeech: 'v.', definition: '吸收；同化；理解', example: 'Immigrants gradually assimilate into the culture.', exampleZh: '移民逐渐融入当地文化。', etymology: '拉丁语 assimilare，ad- + similis（相似的）' },
  { word: 'assumption', phonetic: '/əˈsʌmpʃn/', partOfSpeech: 'n.', definition: '假设；承担；假定', example: 'Your assumption is incorrect.', exampleZh: '你的假设是错误的。', etymology: '拉丁语 assumptio，assumere（采取）' },
  { word: 'assurance', phonetic: '/əˈʃʊərəns/', partOfSpeech: 'n.', definition: '保证；确信；保险', example: 'He gave us his assurance.', exampleZh: '他向我们保证。', etymology: '古法语 assurance，来自 assurer（确保）' },
  { word: 'attain', phonetic: '/əˈteɪn/', partOfSpeech: 'v.', definition: '达到；实现；获得', example: 'She attained her goal through hard work.', exampleZh: '她通过努力实现了目标。', etymology: '拉丁语 attingere，ad- + tangere（触摸）' },
  { word: 'attribute', phonetic: '/əˈtrɪbjuːt/', partOfSpeech: 'v./n.', definition: '归因于；属性；特质', example: 'He attributed his success to luck.', exampleZh: '他把成功归因于运气。', etymology: '拉丁语 attribuere，ad- + tribuere（分配）' },
  { word: 'augment', phonetic: '/ɔːɡˈment/', partOfSpeech: 'v.', definition: '增加；扩大；增强', example: 'He took a second job to augment his income.', exampleZh: '他做了第二份工作来增加收入。', etymology: '拉丁语 augmentare，augere（增加）' },
  { word: 'auspicious', phonetic: '/ɔːˈspɪʃəs/', partOfSpeech: 'adj.', definition: '吉利的；有前途的', example: 'It was an auspicious beginning.', exampleZh: '这是一个吉利的开始。', etymology: '拉丁语 auspicium（占卜），来自 avis（鸟）+ specere（看）' },
  { word: 'authentic', phonetic: '/ɔːˈθentɪk/', partOfSpeech: 'adj.', definition: '真实的；正宗的；可靠的', example: 'This is an authentic Italian restaurant.', exampleZh: '这是一家正宗的意大利餐厅。', etymology: '希腊语 authentikos（主要的，真实的）' },
  { word: 'autonomous', phonetic: '/ɔːˈtɒnəməs/', partOfSpeech: 'adj.', definition: '自治的；自主的；独立的', example: 'The region is fully autonomous.', exampleZh: '该地区完全自治。', etymology: '希腊语 autonomos，auto- + nomos（法律）' },
  { word: 'benevolent', phonetic: '/bəˈnevələnt/', partOfSpeech: 'adj.', definition: '仁慈的；慈善的；善意的', example: 'She was a benevolent leader.', exampleZh: '她是一位仁慈的领导者。', etymology: '拉丁语 benevolens，bene- + velle（愿意）' },
  { word: 'benign', phonetic: '/bɪˈnaɪn/', partOfSpeech: 'adj.', definition: '良性的；温和的；仁慈的', example: 'The tumor was benign.', exampleZh: '肿瘤是良性的。', etymology: '拉丁语 benignus，bene- + gignere（产生）' },
  { word: 'bewilder', phonetic: '/bɪˈwɪldər/', partOfSpeech: 'v.', definition: '使迷惑；使不知所措', example: 'The instructions bewildered me.', exampleZh: '说明书让我困惑。', etymology: 'be- + wilder（使迷失）' },
  { word: 'bolster', phonetic: '/ˈboʊlstər/', partOfSpeech: 'v./n.', definition: '支持；加强；垫子', example: 'The evidence bolstered the case.', exampleZh: '证据加强了案件。', etymology: '古英语 bolster（长枕）' },
  { word: 'breach', phonetic: '/briːtʃ/', partOfSpeech: 'n./v.', definition: '违反；缺口；突破', example: 'This constitutes a breach of contract.', exampleZh: '这构成了违约。', etymology: '古英语 brec（断裂），与 break 相关' },
  { word: 'brevity', phonetic: '/ˈbrevəti/', partOfSpeech: 'n.', definition: '简洁；简短；短暂', example: 'Brevity is the soul of wit.', exampleZh: '简洁是智慧的灵魂。', etymology: '拉丁语 brevitas，来自 brevis（短的）' },
  { word: 'brilliant', phonetic: '/ˈbrɪliənt/', partOfSpeech: 'adj.', definition: '杰出的；明亮的；精彩的', example: 'She made a brilliant speech.', exampleZh: '她做了一场精彩的演讲。', etymology: '法语 brilliant，意大利语 brillare（闪耀）' },
  { word: 'burden', phonetic: '/ˈbɜːrdn/', partOfSpeech: 'n./v.', definition: '负担；重担；使烦恼', example: 'The tax burden is heavy.', exampleZh: '税收负担很重。', etymology: '古英语 byrthen，来自 beran（承受）' },
  { word: 'calculate', phonetic: '/ˈkælkjuleɪt/', partOfSpeech: 'v.', definition: '计算；估计；打算', example: 'We need to calculate the total cost.', exampleZh: '我们需要计算总成本。', etymology: '拉丁语 calculare，来自 calculus（小石子，用于计数）' },
  { word: 'candid', phonetic: '/ˈkændɪd/', partOfSpeech: 'adj.', definition: '坦率的；直言的；公正的', example: 'She gave a candid interview.', exampleZh: '她接受了一次坦率的采访。', etymology: '拉丁语 candidus（白色的，纯洁的）' },
  { word: 'capable', phonetic: '/ˈkeɪpəbl/', partOfSpeech: 'adj.', definition: '有能力的；能干的；可以…的', example: 'She is capable of handling any task.', exampleZh: '她能处理任何任务。', etymology: '晚期拉丁语 capabilis，来自 capere（抓住）' },
  { word: 'captivate', phonetic: '/ˈkæptɪveɪt/', partOfSpeech: 'v.', definition: '迷住；吸引；俘获', example: 'The story captivated the audience.', exampleZh: '故事吸引了观众。', etymology: '晚期拉丁语 captivare，来自 captivus（俘虏）' },
  { word: 'catastrophe', phonetic: '/kəˈtæstrəfi/', partOfSpeech: 'n.', definition: '灾难；大祸；惨败', example: 'The earthquake was a catastrophe.', exampleZh: '地震是一场灾难。', etymology: '希腊语 katastrophē（颠覆），kata- + strephein（转动）' },
  { word: 'cease', phonetic: '/siːs/', partOfSpeech: 'v./n.', definition: '停止；终止；结束', example: 'The factory ceased production.', exampleZh: '工厂停止了生产。', etymology: '古法语 cesser，拉丁语 cessare（停止）' },
  { word: 'chronic', phonetic: '/ˈkrɒnɪk/', partOfSpeech: 'adj.', definition: '慢性的；长期的；习惯性的', example: 'She suffers from chronic pain.', exampleZh: '她患有慢性疼痛。', etymology: '希腊语 khronikos，来自 khronos（时间）' },
  { word: 'circumvent', phonetic: '/ˌsɜːrkəmˈvent/', partOfSpeech: 'v.', definition: '规避；绕过；智胜', example: 'They tried to circumvent the regulations.', exampleZh: '他们试图规避规定。', etymology: '拉丁语 circumvenire，circum- + venire（来）' },
  { word: 'coerce', phonetic: '/koʊˈɜːrs/', partOfSpeech: 'v.', definition: '强迫；胁迫；压制', example: 'He was coerced into signing.', exampleZh: '他被胁迫签字。', etymology: '拉丁语 coercere，co- + arcere（限制）' },
  { word: 'cogent', phonetic: '/ˈkoʊdʒənt/', partOfSpeech: 'adj.', definition: '有说服力的；令人信服的', example: 'She presented a cogent argument.', exampleZh: '她提出了令人信服的论点。', etymology: '拉丁语 cogens，cogere（驱使）的现在分词' },
  { word: 'coherent', phonetic: '/koʊˈhɪrənt/', partOfSpeech: 'adj.', definition: '连贯的；一致的；条理清楚的', example: 'He gave a coherent account of events.', exampleZh: '他对事件做了连贯的叙述。', etymology: '拉丁语 cohaerent-，cohaerere（粘在一起）' },
  { word: 'collaborate', phonetic: '/kəˈlæbəreɪt/', partOfSpeech: 'v.', definition: '合作；协作；通敌', example: 'The teams collaborated on the project.', exampleZh: '团队在项目上合作。', etymology: '拉丁语 collaborare，col- + laborare（工作）' },
  { word: 'complacent', phonetic: '/kəmˈpleɪsnt/', partOfSpeech: 'adj.', definition: '自满的；得意的；漠不关心的', example: 'We must not become complacent.', exampleZh: '我们不能变得自满。', etymology: '拉丁语 complacere（非常取悦）' },
  { word: 'complement', phonetic: '/ˈkɒmplɪmənt/', partOfSpeech: 'n./v.', definition: '补充；补足；互补', example: 'The wine complements the meal.', exampleZh: '葡萄酒与餐食互补。', etymology: '拉丁语 complementum，complere（填满）' },
  { word: 'comply', phonetic: '/kəmˈplaɪ/', partOfSpeech: 'v.', definition: '遵从；服从；顺从', example: 'You must comply with the regulations.', exampleZh: '你必须遵守规定。', etymology: '拉丁语 complere（完成），意大利语 complire（遵从）' },
  { word: 'comprehensive', phonetic: '/ˌkɒmprɪˈhensɪv/', partOfSpeech: 'adj.', definition: '综合的；全面的；有理解力的', example: 'The report is comprehensive.', exampleZh: '报告很全面。', etymology: '拉丁语 comprehensivus，comprehendere（抓住）' },
  { word: 'concede', phonetic: '/kənˈsiːd/', partOfSpeech: 'v.', definition: '承认；让步；退让', example: 'He conceded defeat.', exampleZh: '他承认失败。', etymology: '拉丁语 concedere，con- + cedere（走开）' },
  { word: 'concise', phonetic: '/kənˈsaɪs/', partOfSpeech: 'adj.', definition: '简洁的；简明的', example: 'Please give a concise answer.', exampleZh: '请给出简洁的回答。', etymology: '拉丁语 concisus，concidere（切断）的过去分词' },
  { word: 'confer', phonetic: '/kənˈfɜːr/', partOfSpeech: 'v.', definition: '商议；授予；赋予', example: 'The committee conferred for hours.', exampleZh: '委员会商议了数小时。', etymology: '拉丁语 conferre，con- + ferre（带来）' },
  { word: 'confine', phonetic: '/kənˈfaɪn/', partOfSpeech: 'v./n.', definition: '限制；禁闭；界限', example: 'Please confine your remarks to the topic.', exampleZh: '请将发言限制在主题内。', etymology: '拉丁语 confinis，con- + finis（边界）' },
  { word: 'conform', phonetic: '/kənˈfɔːrm/', partOfSpeech: 'v.', definition: '遵从；符合；一致', example: 'The product conforms to safety standards.', exampleZh: '产品符合安全标准。', etymology: '拉丁语 conformare，con- + formare（形成）' },
  { word: 'confront', phonetic: '/kənˈfrʌnt/', partOfSpeech: 'v.', definition: '面对；对抗；遭遇', example: 'She confronted her fears.', exampleZh: '她面对了自己的恐惧。', etymology: '拉丁语 confrontare，con- + frons（前面）' },
  { word: 'congenial', phonetic: '/kənˈdʒiːniəl/', partOfSpeech: 'adj.', definition: '意气相投的；适宜的；令人愉快的', example: 'He found the atmosphere congenial.', exampleZh: '他觉得氛围很愉快。', etymology: '拉丁语 congenialis，con- + genialis（与生俱来的）' },
  { word: 'conjecture', phonetic: '/kənˈdʒektʃər/', partOfSpeech: 'n./v.', definition: '推测；猜想；猜测', example: 'It is mere conjecture at this point.', exampleZh: '目前这只是猜测。', etymology: '拉丁语 coniectura，conicere（投掷）' },
  { word: 'conscience', phonetic: '/ˈkɒnʃəns/', partOfSpeech: 'n.', definition: '良心；良知；道德感', example: 'His conscience bothered him.', exampleZh: '他的良心让他不安。', etymology: '拉丁语 conscientia，con- + scire（知道）' },
  { word: 'consecutive', phonetic: '/kənˈsekjətɪv/', partOfSpeech: 'adj.', definition: '连续的；连贯的', example: 'It rained for three consecutive days.', exampleZh: '连续下了三天雨。', etymology: '拉丁语 consecutivus，consequi（跟随）' },
  { word: 'consent', phonetic: '/kənˈsent/', partOfSpeech: 'n./v.', definition: '同意；准许；赞成', example: 'She gave her consent to the plan.', exampleZh: '她同意了该计划。', etymology: '拉丁语 consentire，con- + sentire（感觉）' },
  { word: 'conspicuous', phonetic: '/kənˈspɪkjuəs/', partOfSpeech: 'adj.', definition: '显眼的；显著的；惹人注目的', example: 'The sign was very conspicuous.', exampleZh: '标志非常显眼。', etymology: '拉丁语 conspicuus，conspicere（看到）' },
  { word: 'constitute', phonetic: '/ˈkɒnstɪtjuːt/', partOfSpeech: 'v.', definition: '构成；组成；设立', example: 'Women constitute half the population.', exampleZh: '女性占人口的一半。', etymology: '拉丁语 constituere，con- + statuere（设立）' },
  { word: 'constrain', phonetic: '/kənˈstreɪn/', partOfSpeech: 'v.', definition: '约束；限制；强迫', example: 'Budget constraints limited the project.', exampleZh: '预算限制制约了项目。', etymology: '拉丁语 constringere，con- + stringere（绑紧）' },
  { word: 'contemplate', phonetic: '/ˈkɒntəmpleɪt/', partOfSpeech: 'v.', definition: '沉思；注视；打算', example: 'She contemplated the painting for hours.', exampleZh: '她凝视那幅画数小时。', etymology: '拉丁语 contemplari，con- + templum（神殿，观察处）' },
  { word: 'contempt', phonetic: '/kənˈtempt/', partOfSpeech: 'n.', definition: '轻蔑；蔑视；藐视', example: 'He showed contempt for the rules.', exampleZh: '他对规则表现出蔑视。', etymology: '拉丁语 contemptus，contemnere（蔑视）' },
  { word: 'contend', phonetic: '/kənˈtend/', partOfSpeech: 'v.', definition: '竞争；争辩；应对', example: 'Three teams are contending for the title.', exampleZh: '三支队伍在争夺冠军。', etymology: '拉丁语 contendere，con- + tendere（伸展）' },
  { word: 'contradict', phonetic: '/ˌkɒntrəˈdɪkt/', partOfSpeech: 'v.', definition: '反驳；与…矛盾；否认', example: 'The evidence contradicts his statement.', exampleZh: '证据与他的陈述矛盾。', etymology: '拉丁语 contradicere，contra- + dicere（说）' },
  { word: 'controversy', phonetic: '/ˈkɒntrəvɜːrsi/', partOfSpeech: 'n.', definition: '争论；争议；论战', example: 'The decision sparked controversy.', exampleZh: '决定引发了争议。', etymology: '拉丁语 controversia，contra- + versus（转向）' },
  { word: 'convene', phonetic: '/kənˈviːn/', partOfSpeech: 'v.', definition: '召集；集合；开会', example: 'The board will convene next week.', exampleZh: '董事会将于下周开会。', etymology: '拉丁语 convenire，con- + venire（来）' },
  { word: 'converge', phonetic: '/kənˈvɜːrdʒ/', partOfSpeech: 'v.', definition: '汇聚；趋同；聚集', example: 'The two rivers converge here.', exampleZh: '两条河在这里汇合。', etymology: '拉丁语 convergere，con- + vergere（倾向）' },
  { word: 'corroborate', phonetic: '/kəˈrɒbəreɪt/', partOfSpeech: 'v.', definition: '证实；确认；支持', example: 'The witness corroborated his story.', exampleZh: '证人证实了他的说法。', etymology: '拉丁语 corroborare，cor- + robustus（强壮的）' },
  { word: 'credulous', phonetic: '/ˈkredʒələs/', partOfSpeech: 'adj.', definition: '轻信的；易受骗的', example: 'She is too credulous for her own good.', exampleZh: '她太轻信了，对自己不利。', etymology: '拉丁语 credulus，来自 credere（相信）' },
  { word: 'cumulative', phonetic: '/ˈkjuːmjələtɪv/', partOfSpeech: 'adj.', definition: '累积的；渐增的', example: 'The cumulative effect was significant.', exampleZh: '累积效应是显著的。', etymology: '拉丁语 cumulativus，来自 cumulus（堆）' },
  { word: 'cursory', phonetic: '/ˈkɜːrsəri/', partOfSpeech: 'adj.', definition: '粗略的；草率的；匆忙的', example: 'He gave the report a cursory glance.', exampleZh: '他粗略地看了一眼报告。', etymology: '拉丁语 cursorius，来自 cursor（跑者）' },
  { word: 'debatable', phonetic: '/dɪˈbeɪtəbl/', partOfSpeech: 'adj.', definition: '有争议的；可争论的', example: 'The results are debatable.', exampleZh: '结果有争议。', etymology: '古法语 debatable，来自 debatre（争辩）' },
  { word: 'decimate', phonetic: '/ˈdesɪmeɪt/', partOfSpeech: 'v.', definition: '大批毁灭；严重破坏；杀戮', example: 'The disease decimated the population.', exampleZh: '疾病使人口大量减少。', etymology: '拉丁语 decimare，来自 decimus（十分之一）' },
  { word: 'decipher', phonetic: '/dɪˈsaɪfər/', partOfSpeech: 'v.', definition: '破译；辨认；解读', example: 'Experts deciphered the ancient text.', exampleZh: '专家破译了古代文本。', etymology: 'de- + cipher（密码），来自阿拉伯语 sifr（零）' },
  { word: 'deference', phonetic: '/ˈdefərəns/', partOfSpeech: 'n.', definition: '敬意；顺从；尊重', example: 'He treated her with deference.', exampleZh: '他对她表示敬意。', etymology: '拉丁语 deferre（提交），引申为尊重' },
  { word: 'deficient', phonetic: '/dɪˈfɪʃnt/', partOfSpeech: 'adj.', definition: '不足的；缺乏的；有缺陷的', example: 'The diet is deficient in vitamins.', exampleZh: '饮食缺乏维生素。', etymology: '拉丁语 deficiens，deficere（缺乏）' },
  { word: 'deliberate', phonetic: '/dɪˈlɪbərət/', partOfSpeech: 'adj./v.', definition: '故意的；深思熟虑的；仔细考虑', example: 'It was a deliberate decision.', exampleZh: '这是一个深思熟虑的决定。', etymology: '拉丁语 deliberare，de- + librare（称量）' },
  { word: 'delineate', phonetic: '/dɪˈlɪnieɪt/', partOfSpeech: 'v.', definition: '描绘；描述；勾画', example: 'The report delineates the problem clearly.', exampleZh: '报告清楚地描述了问题。', etymology: '拉丁语 delineare，de- + linea（线）' },
  { word: 'demise', phonetic: '/dɪˈmaɪz/', partOfSpeech: 'n.', definition: '死亡；终止；转让', example: 'The demise of the company was unexpected.', exampleZh: '公司的倒闭出人意料。', etymology: '古法语 demise，来自 desmis（转移）' },
  { word: 'demur', phonetic: '/dɪˈmɜːr/', partOfSpeech: 'v./n.', definition: '反对；犹豫；异议', example: 'She demurred at the suggestion.', exampleZh: '她对建议表示异议。', etymology: '古法语 demorer（停留），引申为犹豫' },
  { word: 'denounce', phonetic: '/dɪˈnaʊns/', partOfSpeech: 'v.', definition: '谴责；告发；废除', example: 'He denounced the corruption.', exampleZh: '他谴责了腐败。', etymology: '拉丁语 denuntiare，de- + nuntiare（宣布）' },
  { word: 'depict', phonetic: '/dɪˈpɪkt/', partOfSpeech: 'v.', definition: '描绘；描述；刻画', example: 'The novel depicts life in the 19th century.', exampleZh: '小说描绘了19世纪的生活。', etymology: '拉丁语 depingere，de- + pingere（画）' },
  { word: 'deplete', phonetic: '/dɪˈpliːt/', partOfSpeech: 'v.', definition: '耗尽；减少；使空虚', example: 'The resources were rapidly depleted.', exampleZh: '资源被迅速耗尽。', etymology: '拉丁语 deplere，de- + plere（填满）' },
  { word: 'deploy', phonetic: '/dɪˈplɔɪ/', partOfSpeech: 'v.', definition: '部署；展开；利用', example: 'The troops were deployed to the border.', exampleZh: '部队被部署到边境。', etymology: '法语 déployer，拉丁语 displicare（展开）' },
  { word: 'deprive', phonetic: '/dɪˈpraɪv/', partOfSpeech: 'v.', definition: '剥夺；使丧失', example: 'They were deprived of their rights.', exampleZh: '他们被剥夺了权利。', etymology: '拉丁语 deprivare，de- + privare（剥夺）' },
  { word: 'derive', phonetic: '/dɪˈraɪv/', partOfSpeech: 'v.', definition: '源于；获得；推导', example: 'The word derives from Latin.', exampleZh: '这个词源自拉丁语。', etymology: '拉丁语 derivare，de- + rivus（溪流）' },
  { word: 'desolate', phonetic: '/ˈdesələt/', partOfSpeech: 'adj./v.', definition: '荒凉的；孤寂的；使荒凉', example: 'The landscape was desolate.', exampleZh: '景色荒凉。', etymology: '拉丁语 desolatus，de- + solus（孤独的）' },
  { word: 'despair', phonetic: '/dɪˈspeər/', partOfSpeech: 'n./v.', definition: '绝望；令人绝望的事物', example: 'She was in despair.', exampleZh: '她处于绝望之中。', etymology: '拉丁语 desperare，de- + sperare（希望）' },
  { word: 'deviate', phonetic: '/ˈdiːvieɪt/', partOfSpeech: 'v.', definition: '偏离；背离；违背', example: 'Do not deviate from the plan.', exampleZh: '不要偏离计划。', etymology: '拉丁语 deviare，de- + via（路）' },
  { word: 'devour', phonetic: '/dɪˈvaʊər/', partOfSpeech: 'v.', definition: '吞食；毁灭；贪婪地阅读', example: 'He devoured the book in one sitting.', exampleZh: '他一口气读完了这本书。', etymology: '古法语 devorer，拉丁语 devorare（吞下）' },
  { word: 'diagnose', phonetic: '/ˈdaɪəɡnoʊz/', partOfSpeech: 'v.', definition: '诊断；判断；分析', example: 'The doctor diagnosed the illness.', exampleZh: '医生诊断了疾病。', etymology: '希腊语 diagignōskein，dia- + gignōskein（认识）' },
  { word: 'dilemma', phonetic: '/dɪˈlemə/', partOfSpeech: 'n.', definition: '困境；两难；进退维谷', example: 'She faced a moral dilemma.', exampleZh: '她面临道德困境。', etymology: '希腊语 dilēmma，di- + lēmma（命题）' },
  { word: 'diminish', phonetic: '/dɪˈmɪnɪʃ/', partOfSpeech: 'v.', definition: '减少；缩小；贬低', example: 'The noise gradually diminished.', exampleZh: '噪音逐渐减弱。', etymology: '拉丁语 deminuere，de- + minuere（减少）' },
  { word: 'discern', phonetic: '/dɪˈsɜːrn/', partOfSpeech: 'v.', definition: '辨别；识别；看出', example: 'She could discern a figure in the fog.', exampleZh: '她能在雾中辨认出一个身影。', etymology: '拉丁语 discernere，dis- + cernere（区分）' },
  { word: 'discreet', phonetic: '/dɪˈskriːt/', partOfSpeech: 'adj.', definition: '谨慎的；审慎的；不显眼的', example: 'He was discreet about his plans.', exampleZh: '他对自己的计划很谨慎。', etymology: '拉丁语 discretus，discernere（区分）的过去分词' },
  { word: 'discrepancy', phonetic: '/dɪˈskrepənsi/', partOfSpeech: 'n.', definition: '差异；不一致；矛盾', example: 'There was a discrepancy in the accounts.', exampleZh: '账目有出入。', etymology: '拉丁语 discrepare（不一致）' },
  { word: 'discrete', phonetic: '/dɪˈskriːt/', partOfSpeech: 'adj.', definition: '离散的；不相关的；分开的', example: 'The data consists of discrete values.', exampleZh: '数据由离散值组成。', etymology: '拉丁语 discretus（分离的）' },
  { word: 'dismantle', phonetic: '/dɪsˈmæntl/', partOfSpeech: 'v.', definition: '拆除；拆解；废除', example: 'They dismantled the old machinery.', exampleZh: '他们拆除了旧机器。', etymology: '古法语 desmanteler，des- + mantel（斗篷）' },
  { word: 'dispense', phonetic: '/dɪˈspens/', partOfSpeech: 'v.', definition: '分配；免除；配药', example: 'The machine dispenses drinks.', exampleZh: '机器分配饮料。', etymology: '拉丁语 dispensare，dis- + pensare（称量）' },
  { word: 'disposition', phonetic: '/ˌdɪspəˈzɪʃn/', partOfSpeech: 'n.', definition: '性情；倾向；处置', example: 'She has a cheerful disposition.', exampleZh: '她性格开朗。', etymology: '拉丁语 dispositio，disponere（安排）' },
  { word: 'disrupt', phonetic: '/dɪsˈrʌpt/', partOfSpeech: 'v.', definition: '扰乱；破坏；使中断', example: 'The protest disrupted traffic.', exampleZh: '抗议扰乱了交通。', etymology: '拉丁语 disruptus，rumpere（断裂）的过去分词' },
  { word: 'dissipate', phonetic: '/ˈdɪsɪpeɪt/', partOfSpeech: 'v.', definition: '消散；驱散；挥霍', example: 'The fog dissipated by noon.', exampleZh: '雾在中午消散了。', etymology: '拉丁语 dissipare，dis- + supare（扔）' },
  { word: 'distort', phonetic: '/dɪˈstɔːrt/', partOfSpeech: 'v.', definition: '扭曲；歪曲；使变形', example: 'The mirror distorted his reflection.', exampleZh: '镜子扭曲了他的倒影。', etymology: '拉丁语 distortus，dis- + torquere（扭转）' },
  { word: 'diverge', phonetic: '/daɪˈvɜːrdʒ/', partOfSpeech: 'v.', definition: '分歧；偏离；分叉', example: 'Their opinions diverged on the issue.', exampleZh: '他们在这一问题上意见分歧。', etymology: '拉丁语 divergere，dis- + vergere（倾向）' },
  { word: 'divulge', phonetic: '/daɪˈvʌldʒ/', partOfSpeech: 'v.', definition: '泄露；透露；公开', example: 'He refused to divulge the information.', exampleZh: '他拒绝透露信息。', etymology: '拉丁语 divulgare，dis- + vulgare（传播）' },
  { word: 'doctrine', phonetic: '/ˈdɒktrɪn/', partOfSpeech: 'n.', definition: '教义；学说；信条', example: 'The doctrine was widely accepted.', exampleZh: '该学说被广泛接受。', etymology: '拉丁语 doctrina，来自 docere（教导）' },
  { word: 'dominate', phonetic: '/ˈdɒmɪneɪt/', partOfSpeech: 'v.', definition: '支配；控制；占优势', example: 'The company dominates the market.', exampleZh: '该公司主导市场。', etymology: '拉丁语 dominari，来自 dominus（主人）' },
  { word: 'dormant', phonetic: '/ˈdɔːrmənt/', partOfSpeech: 'adj.', definition: '休眠的；潜伏的；静止的', example: 'The volcano is currently dormant.', exampleZh: '火山目前处于休眠状态。', etymology: '拉丁语 dormire（睡觉）' },
  { word: 'draconian', phonetic: '/drəˈkoʊniən/', partOfSpeech: 'adj.', definition: '严厉的；残酷的', example: 'The measures were draconian.', exampleZh: '措施非常严厉。', etymology: '来自古希腊立法者 Draco' },
  { word: 'dubious', phonetic: '/ˈdjuːbiəs/', partOfSpeech: 'adj.', definition: '可疑的；不确定的；犹豫的', example: 'His claims are dubious.', exampleZh: '他的说法可疑。', etymology: '拉丁语 dubius（怀疑的）' },
  { word: 'durable', phonetic: '/ˈdjʊərəbl/', partOfSpeech: 'adj.', definition: '耐用的；持久的；坚固的', example: 'The material is highly durable.', exampleZh: '这种材料非常耐用。', etymology: '拉丁语 durabilis，来自 durare（持续）' },
  { word: 'eclectic', phonetic: '/ɪˈklektɪk/', partOfSpeech: 'adj.', definition: '折衷的；兼收并蓄的', example: 'She has eclectic tastes in music.', exampleZh: '她的音乐品味兼收并蓄。', etymology: '希腊语 eklektikos，ek- + legere（选择）' },
  { word: 'efficacy', phonetic: '/ˈefɪkəsi/', partOfSpeech: 'n.', definition: '效力；功效；效能', example: 'The efficacy of the drug was proven.', exampleZh: '药物的效力已被证实。', etymology: '拉丁语 efficacia，来自 efficere（产生效果）' },
  { word: 'elaborate', phonetic: '/ɪˈlæbəreɪt/', partOfSpeech: 'adj./v.', definition: '精心的；详尽的；详细说明', example: 'She elaborated on her plan.', exampleZh: '她详细说明了计划。', etymology: '拉丁语 elaborare，e- + laborare（工作）' },
  { word: 'elegant', phonetic: '/ˈelɪɡənt/', partOfSpeech: 'adj.', definition: '优雅的；精致的；简洁的', example: 'She wore an elegant dress.', exampleZh: '她穿着一件优雅的连衣裙。', etymology: '拉丁语 elegans（精选的）' },
  { word: 'elicit', phonetic: '/ɪˈlɪsɪt/', partOfSpeech: 'v.', definition: '引出；诱出；引起', example: 'The question elicited a strong response.', exampleZh: '问题引起了强烈反应。', etymology: '拉丁语 elicere，e- + lacere（引诱）' },
  { word: 'eloquent', phonetic: '/ˈeləkwənt/', partOfSpeech: 'adj.', definition: '雄辩的；有说服力的；意味深长的', example: 'She gave an eloquent speech.', exampleZh: '她发表了一场雄辩的演讲。', etymology: '拉丁语 eloquens，eloqui（说出）' },
  { word: 'emancipate', phonetic: '/ɪˈmænsɪpeɪt/', partOfSpeech: 'v.', definition: '解放；解除束缚', example: 'The law emancipated the slaves.', exampleZh: '法律解放了奴隶。', etymology: '拉丁语 emancipare，e- + mancipare（转让所有权）' },
  { word: 'embellish', phonetic: '/ɪmˈbelɪʃ/', partOfSpeech: 'v.', definition: '装饰；润色；夸大', example: 'He embellished the story with details.', exampleZh: '他用细节润色了故事。', etymology: '古法语 embellir，en- + bel（美丽的）' },
  { word: 'embody', phonetic: '/ɪmˈbɒdi/', partOfSpeech: 'v.', definition: '体现；使具体化；包含', example: 'She embodies the spirit of innovation.', exampleZh: '她体现了创新精神。', etymology: 'em- + body（身体），使成为形体' },
  { word: 'eminent', phonetic: '/ˈemɪnənt/', partOfSpeech: 'adj.', definition: '杰出的；著名的；显赫的', example: 'He is an eminent scientist.', exampleZh: '他是一位杰出的科学家。', etymology: '拉丁语 eminens，eminere（突出）' },
  { word: 'empathy', phonetic: '/ˈempəθi/', partOfSpeech: 'n.', definition: '同理心；共情；移情', example: 'She showed great empathy for others.', exampleZh: '她对他人表现出极大的同理心。', etymology: '希腊语 empatheia，en- + pathos（感受）' },
  { word: 'empirical', phonetic: '/ɪmˈpɪrɪkl/', partOfSpeech: 'adj.', definition: '经验主义的；以经验为依据的', example: 'The study is based on empirical data.', exampleZh: '研究基于经验数据。', etymology: '希腊语 empeirikos，en- + peira（经验）' },
  { word: 'encompass', phonetic: '/ɪnˈkʌmpəs/', partOfSpeech: 'v.', definition: '包含；围绕；涵盖', example: 'The course encompasses many topics.', exampleZh: '课程涵盖许多主题。', etymology: 'en- + compass（范围）' },
  { word: 'endorse', phonetic: '/ɪnˈdɔːrs/', partOfSpeech: 'v.', definition: '赞同；支持；背书', example: 'The committee endorsed the proposal.', exampleZh: '委员会支持该提案。', etymology: '拉丁语 indorsare，in- + dorsum（背部）' },
  { word: 'endure', phonetic: '/ɪnˈdjʊər/', partOfSpeech: 'v.', definition: '忍受；持续；忍耐', example: 'She endured many hardships.', exampleZh: '她忍受了许多艰难。', etymology: '拉丁语 indurare，in- + durus（坚硬的）' },
  { word: 'engender', phonetic: '/ɪnˈdʒendər/', partOfSpeech: 'v.', definition: '产生；引起；造成', example: 'The policy engendered controversy.', exampleZh: '政策引起了争议。', etymology: '拉丁语 ingenerare，in- + generare（产生）' },
  { word: 'enigma', phonetic: '/ɪˈnɪɡmə/', partOfSpeech: 'n.', definition: '谜；费解的事物；神秘的人', example: 'The origin of the universe remains an enigma.', exampleZh: '宇宙的起源仍是一个谜。', etymology: '希腊语 ainigma，来自 ainissesthai（暗示）' },
  { word: 'enlighten', phonetic: '/ɪnˈlaɪtn/', partOfSpeech: 'v.', definition: '启发；开导；使明白', example: 'The book enlightened me on the subject.', exampleZh: '这本书启发了我对这个问题的认识。', etymology: 'en- + light（光），使见到光明' },
  { word: 'entail', phonetic: '/ɪnˈteɪl/', partOfSpeech: 'v.', definition: '需要；牵涉；限定继承', example: 'The project entails significant investment.', exampleZh: '项目需要大量投资。', etymology: '古法语 entailler（切割），法律用语' },
  { word: 'ephemeral', phonetic: '/ɪˈfemərəl/', partOfSpeech: 'adj.', definition: '短暂的；转瞬即逝的', example: 'Fame can be ephemeral.', exampleZh: '名声可能是短暂的。', etymology: '希腊语 ephēmeros，epi- + hēmera（一天）' },
  { word: 'eradicate', phonetic: '/ɪˈrædɪkeɪt/', partOfSpeech: 'v.', definition: '根除；消灭；杜绝', example: 'The disease has been eradicated.', exampleZh: '这种疾病已被根除。', etymology: '拉丁语 eradicare，e- + radix（根）' },
  { word: 'erratic', phonetic: '/ɪˈrætɪk/', partOfSpeech: 'adj.', definition: '不规则的；古怪的；反复无常的', example: 'His behavior was erratic.', exampleZh: '他的行为反复无常。', etymology: '拉丁语 erraticus，errare（游荡）' },
  { word: 'escalate', phonetic: '/ˈeskəleɪt/', partOfSpeech: 'v.', definition: '升级；加剧；逐步上升', example: 'The conflict escalated rapidly.', exampleZh: '冲突迅速升级。', etymology: '来自 escalator（自动扶梯），比喻用法' },
  { word: 'espouse', phonetic: '/ɪˈspaʊz/', partOfSpeech: 'v.', definition: '拥护；支持；信奉', example: 'She espoused the cause of equality.', exampleZh: '她拥护平等事业。', etymology: '古法语 espouser，拉丁语 sponsare（承诺）' },
  { word: 'eulogy', phonetic: '/ˈjuːlədʒi/', partOfSpeech: 'n.', definition: '颂词；悼词；赞颂', example: 'He delivered a moving eulogy.', exampleZh: '他发表了一篇感人的悼词。', etymology: '希腊语 eulogia，eu- + logos（言辞）' },
  { word: 'evade', phonetic: '/ɪˈveɪd/', partOfSpeech: 'v.', definition: '逃避；规避；回避', example: 'He tried to evade the question.', exampleZh: '他试图回避问题。', etymology: '拉丁语 evadere，e- + vadere（走）' },
  { word: 'exacerbate', phonetic: '/ɪɡˈzæsərbeɪt/', partOfSpeech: 'v.', definition: '加剧；使恶化；激怒', example: 'The heat exacerbated the drought.', exampleZh: '高温加剧了旱情。', etymology: '拉丁语 exacerbare，ex- + acerbus（尖锐的）' },
  { word: 'exemplify', phonetic: '/ɪɡˈzemplɪfaɪ/', partOfSpeech: 'v.', definition: '例证；作为…的典范；举例说明', example: 'This case exemplifies the problem.', exampleZh: '这个案例说明了问题。', etymology: '拉丁语 exemplum（例子）+ -fy' },
  { word: 'exert', phonetic: '/ɪɡˈzɜːrt/', partOfSpeech: 'v.', definition: '发挥；施加；努力', example: 'She exerted considerable influence.', exampleZh: '她发挥了相当大的影响力。', etymology: '拉丁语 exsertare，ex- + serere（连接）' },
  { word: 'exhilarate', phonetic: '/ɪɡˈzɪləreɪt/', partOfSpeech: 'v.', definition: '使高兴；使振奋', example: 'The news exhilarated everyone.', exampleZh: '消息使每个人振奋。', etymology: '拉丁语 exhilarare，ex- + hilarus（快乐的）' },
  { word: 'expedite', phonetic: '/ˈekspədaɪt/', partOfSpeech: 'v.', definition: '加速；促进；发送', example: 'We need to expedite the process.', exampleZh: '我们需要加快进程。', etymology: '拉丁语 expedire，ex- + pes（脚）' },
  { word: 'exploit', phonetic: '/ɪkˈsplɔɪt/', partOfSpeech: 'v./n.', definition: '利用；开发；功绩', example: 'We must exploit this opportunity.', exampleZh: '我们必须利用这个机会。', etymology: '拉丁语 explicare（展开）' },
  { word: 'exquisite', phonetic: '/ɪkˈskwɪzɪt/', partOfSpeech: 'adj.', definition: '精美的；精致的；强烈的', example: 'The craftsmanship is exquisite.', exampleZh: '工艺精美绝伦。', etymology: '拉丁语 exquisitus，exquirere（仔细寻找）' },
  { word: 'extol', phonetic: '/ɪkˈstoʊl/', partOfSpeech: 'v.', definition: '赞美；颂扬；极力称赞', example: 'He extolled the virtues of hard work.', exampleZh: '他赞扬了勤劳的美德。', etymology: '拉丁语 extollere，ex- + tollere（举起）' },
  { word: 'extricate', phonetic: '/ˈekstrɪkeɪt/', partOfSpeech: 'v.', definition: '解救；使解脱；抽出', example: 'She extricated herself from the situation.', exampleZh: '她使自己从困境中脱身。', etymology: '拉丁语 extricare，ex- + tricae（纠缠）' },
  { word: 'fabricate', phonetic: '/ˈfæbrɪkeɪt/', partOfSpeech: 'v.', definition: '捏造；制造；装配', example: 'He fabricated the entire story.', exampleZh: '他捏造了整个故事。', etymology: '拉丁语 fabricari，来自 faber（工匠）' },
  { word: 'facilitate', phonetic: '/fəˈsɪlɪteɪt/', partOfSpeech: 'v.', definition: '促进；使便利；帮助', example: 'Technology facilitates communication.', exampleZh: '技术促进了沟通。', etymology: '拉丁语 facilitare，facilis（容易的）' },
  { word: 'fallible', phonetic: '/ˈfæləbl/', partOfSpeech: 'adj.', definition: '易犯错的；可能犯错的', example: 'Human beings are fallible.', exampleZh: '人是会犯错的。', etymology: '拉丁语 fallibilis，fallere（欺骗）' },
  { word: 'fascinate', phonetic: '/ˈfæsɪneɪt/', partOfSpeech: 'v.', definition: '使着迷；深深吸引', example: 'The stars fascinate me.', exampleZh: '星星让我着迷。', etymology: '拉丁语 fascinare（施魔法）' },
  { word: 'feasible', phonetic: '/ˈfiːzəbl/', partOfSpeech: 'adj.', definition: '可行的；可能的；合理的', example: 'The plan is technically feasible.', exampleZh: '计划在技术上是可行的。', etymology: '古法语 faisible，来自 faire（做）' },
  { word: 'fervent', phonetic: '/ˈfɜːrvənt/', partOfSpeech: 'adj.', definition: '热烈的；强烈的；热情的', example: 'She is a fervent supporter.', exampleZh: '她是一位热情的支持者。', etymology: '拉丁语 fervens，fervere（沸腾）' },
  { word: 'flagrant', phonetic: '/ˈfleɪɡrənt/', partOfSpeech: 'adj.', definition: '公然的；明目张胆的；臭名远扬的', example: 'It was a flagrant violation.', exampleZh: '这是公然的违规。', etymology: '拉丁语 flagrant-（燃烧的）' },
  { word: 'fluctuate', phonetic: '/ˈflʌktʃueɪt/', partOfSpeech: 'v.', definition: '波动；起伏；动摇', example: 'Prices fluctuate with demand.', exampleZh: '价格随需求波动。', etymology: '拉丁语 fluctuare，来自 fluctus（波浪）' },
  { word: 'formidable', phonetic: '/ˈfɔːrmɪdəbl/', partOfSpeech: 'adj.', definition: '强大的；令人敬畏的；难以应付的', example: 'She is a formidable opponent.', exampleZh: '她是一个强大的对手。', etymology: '拉丁语 formidabilis，formidare（害怕）' },
  { word: 'fortify', phonetic: '/ˈfɔːrtɪfaɪ/', partOfSpeech: 'v.', definition: '加强；设防；增强', example: 'They fortified the city walls.', exampleZh: '他们加固了城墙。', etymology: '拉丁语 fortificare，fortis（强壮的）' },
  { word: 'foster', phonetic: '/ˈfɒstər/', partOfSpeech: 'v.', definition: '培养；促进；养育', example: 'We must foster innovation.', exampleZh: '我们必须培养创新。', etymology: '古英语 fōstrian（养育）' },
  { word: 'frivolous', phonetic: '/ˈfrɪvələs/', partOfSpeech: 'adj.', definition: '轻浮的；无聊的；不严肃的', example: 'He dismissed the complaint as frivolous.', exampleZh: '他认为投诉是无稽之谈。', etymology: '拉丁语 frivolus（无价值的）' },
  { word: 'frustrate', phonetic: '/frʌˈstreɪt/', partOfSpeech: 'v.', definition: '使沮丧；挫败；阻挠', example: 'The delay frustrated everyone.', exampleZh: '延误使每个人都很沮丧。', etymology: '拉丁语 frustrare（欺骗，使失望）' },
  { word: 'futile', phonetic: '/ˈfjuːtaɪl/', partOfSpeech: 'adj.', definition: '徒劳的；无用的；无意义的', example: 'All our efforts were futile.', exampleZh: '我们所有的努力都是徒劳的。', etymology: '拉丁语 futilis（无用的，易漏的）' },
  { word: 'generous', phonetic: '/ˈdʒenərəs/', partOfSpeech: 'adj.', definition: '慷慨的；大方的；丰富的', example: 'He is generous with his time.', exampleZh: '他乐于付出时间。', etymology: '拉丁语 generosus（高贵的），来自 genus（种族）' },
  { word: 'genuine', phonetic: '/ˈdʒenjuɪn/', partOfSpeech: 'adj.', definition: '真正的；真诚的；名副其实的', example: 'Her concern was genuine.', exampleZh: '她的关心是真诚的。', etymology: '拉丁语 genuinus，来自 gignere（产生）' },
  { word: 'gratitude', phonetic: '/ˈɡrætɪtjuːd/', partOfSpeech: 'n.', definition: '感激；感谢；感恩', example: 'She expressed her gratitude.', exampleZh: '她表达了感激之情。', etymology: '拉丁语 gratitudo，来自 gratus（感激的）' },
  { word: 'grievance', phonetic: '/ˈɡriːvəns/', partOfSpeech: 'n.', definition: '不满；委屈；申诉', example: 'They filed a formal grievance.', exampleZh: '他们提出了正式申诉。', etymology: '古法语 grevance，来自 grever（压迫）' },
  { word: 'harmony', phonetic: '/ˈhɑːrməni/', partOfSpeech: 'n.', definition: '和谐；融洽；协调', example: 'They live in harmony with nature.', exampleZh: '他们与自然和谐共处。', etymology: '希腊语 harmonia（连接，协调）' },
  { word: 'hazard', phonetic: '/ˈhæzərd/', partOfSpeech: 'n./v.', definition: '危险；风险；冒险', example: 'Smoking is a health hazard.', exampleZh: '吸烟是健康危害。', etymology: '古法语 hasard（骰子游戏）' },
  { word: 'hierarchy', phonetic: '/ˈhaɪərɑːrki/', partOfSpeech: 'n.', definition: '等级制度；层级；层次体系', example: 'The company has a strict hierarchy.', exampleZh: '公司有严格的等级制度。', etymology: '希腊语 hierarkhia，hieros（神圣的）+ arkhē（统治）' },
  { word: 'hinder', phonetic: '/ˈhɪndər/', partOfSpeech: 'v.', definition: '阻碍；妨碍；阻止', example: 'Bad weather hindered the rescue.', exampleZh: '恶劣天气阻碍了救援。', etymology: '古英语 hindrian（伤害）' },
  { word: 'hypothesis', phonetic: '/haɪˈpɒθəsɪs/', partOfSpeech: 'n.', definition: '假设；假说；前提', example: 'The hypothesis needs testing.', exampleZh: '假设需要验证。', etymology: '希腊语 hypothesis，hypo- + thesis（放置）' },
  { word: 'iconoclast', phonetic: '/aɪˈkɒnəklæst/', partOfSpeech: 'n.', definition: '偶像破坏者；攻击传统者', example: 'He was an iconoclast in his field.', exampleZh: '他是他那个领域的叛逆者。', etymology: '希腊语 eikonoklastēs，eikon（偶像）+ klastēs（破坏者）' },
  { word: 'ignorance', phonetic: '/ˈɪɡnərəns/', partOfSpeech: 'n.', definition: '无知；愚昧；不知', example: 'Ignorance of the law is no excuse.', exampleZh: '不知法不能作为借口。', etymology: '拉丁语 ignorantia，ignorare（不知道）' },
  { word: 'illicit', phonetic: '/ɪˈlɪsɪt/', partOfSpeech: 'adj.', definition: '非法的；违禁的；不正当的', example: 'The trade was illicit.', exampleZh: '贸易是非法的。', etymology: '拉丁语 illicitus，in- + licitus（合法的）' },
  { word: 'illuminate', phonetic: '/ɪˈluːmɪneɪt/', partOfSpeech: 'v.', definition: '照亮；阐明；使辉煌', example: 'The study illuminates the issue.', exampleZh: '研究阐明了这个问题。', etymology: '拉丁语 illuminare，in- + lumen（光）' },
  { word: 'illustrate', phonetic: '/ˈɪləstreɪt/', partOfSpeech: 'v.', definition: '说明；举例说明；给…加插图', example: 'Let me illustrate my point.', exampleZh: '让我来说明我的观点。', etymology: '拉丁语 illustrare，in- + lustrare（照亮）' },
  { word: 'imminent', phonetic: '/ˈɪmɪnənt/', partOfSpeech: 'adj.', definition: '即将发生的；迫近的', example: 'War seemed imminent.', exampleZh: '战争似乎迫在眉睫。', etymology: '拉丁语 imminere，in- + minere（悬垂）' },
  { word: 'impair', phonetic: '/ɪmˈpeər/', partOfSpeech: 'v.', definition: '损害；削弱；减少', example: 'Alcohol impairs judgment.', exampleZh: '酒精损害判断力。', etymology: '拉丁语 impejorare，im- + pejor（更坏）' },
  { word: 'impeccable', phonetic: '/ɪmˈpekəbl/', partOfSpeech: 'adj.', definition: '无瑕的；完美的；无可挑剔的', example: 'Her taste is impeccable.', exampleZh: '她的品味无可挑剔。', etymology: '拉丁语 impeccabilis，in- + peccare（犯错）' },
  { word: 'implicit', phonetic: '/ɪmˈplɪsɪt/', partOfSpeech: 'adj.', definition: '含蓄的；隐含的；无疑问的', example: 'There was an implicit warning.', exampleZh: '有一个含蓄的警告。', etymology: '拉丁语 implicitus，implicare（折叠）' },
  { word: 'importune', phonetic: '/ˌɪmpɔːrˈtjuːn/', partOfSpeech: 'v.', definition: '纠缠；强求；一再要求', example: 'He importuned her for money.', exampleZh: '他缠着她要钱。', etymology: '拉丁语 importunus（不方便的）' },
  { word: 'impunity', phonetic: '/ɪmˈpjuːnəti/', partOfSpeech: 'n.', definition: '免罚；不受惩罚', example: 'They acted with impunity.', exampleZh: '他们行事肆无忌惮。', etymology: '拉丁语 impunitas，in- + poena（惩罚）' },
  { word: 'inadvertent', phonetic: '/ˌɪnədˈvɜːrtənt/', partOfSpeech: 'adj.', definition: '无意的；疏忽的', example: 'The error was inadvertent.', exampleZh: '错误是无意的。', etymology: '拉丁语 inadvertere（不注意）' },
  { word: 'incentive', phonetic: '/ɪnˈsentɪv/', partOfSpeech: 'n.', definition: '激励；动机；刺激', example: 'Tax breaks provide an incentive.', exampleZh: '税收减免提供了激励。', etymology: '拉丁语 incentivus（调音的），in- + cantare（唱歌）' },
  { word: 'incongruous', phonetic: '/ɪnˈkɒŋɡruəs/', partOfSpeech: 'adj.', definition: '不协调的；不合适的；不一致的', example: 'The joke was incongruous at the funeral.', exampleZh: '在葬礼上开玩笑是不合时宜的。', etymology: '拉丁语 incongruus，in- + congruus（一致的）' },
  { word: 'indigenous', phonetic: '/ɪnˈdɪdʒənəs/', partOfSpeech: 'adj.', definition: '本土的；土生土长的；原产的', example: 'The plant is indigenous to the region.', exampleZh: '该植物是该地区的本土物种。', etymology: '拉丁语 indigena，indu- + gignere（产生）' },
  { word: 'indignant', phonetic: '/ɪnˈdɪɡnənt/', partOfSpeech: 'adj.', definition: '愤慨的；愤怒的；不平的', example: 'She was indignant at the accusation.', exampleZh: '她对指控感到愤慨。', etymology: '拉丁语 indignus（不值得的）' },
  { word: 'indispensable', phonetic: '/ˌɪndɪˈspensəbl/', partOfSpeech: 'adj.', definition: '不可缺少的；必需的', example: 'Water is indispensable to life.', exampleZh: '水是生命不可缺少的。', etymology: '拉丁语 indispensabilis，in- + dispensare（分配）' },
  { word: 'inevitable', phonetic: '/ɪnˈevɪtəbl/', partOfSpeech: 'adj.', definition: '不可避免的；必然的', example: 'Change is inevitable.', exampleZh: '变化是不可避免的。', etymology: '拉丁语 inevitabilis，in- + evitare（避免）' },
  { word: 'infamous', phonetic: '/ˈɪnfəməs/', partOfSpeech: 'adj.', definition: '声名狼藉的；臭名昭著的', example: 'He was an infamous criminal.', exampleZh: '他是个臭名昭著的罪犯。', etymology: '拉丁语 infamis，in- + fama（名声）' },
  { word: 'inhibit', phonetic: '/ɪnˈhɪbɪt/', partOfSpeech: 'v.', definition: '抑制；阻止；禁止', example: 'Fear can inhibit progress.', exampleZh: '恐惧会阻碍进步。', etymology: '拉丁语 inhibere，in- + habere（持有）' },
  { word: 'innate', phonetic: '/ɪˈneɪt/', partOfSpeech: 'adj.', definition: '天生的；固有的；先天的', example: 'She has an innate talent for music.', exampleZh: '她有音乐天赋。', etymology: '拉丁语 innatus，in- + nasci（出生）' },
  { word: 'innocuous', phonetic: '/ɪˈnɒkjuəs/', partOfSpeech: 'adj.', definition: '无害的；无毒的；无关痛痒的', example: 'The remark was innocuous.', exampleZh: '这句话是无害的。', etymology: '拉丁语 innocuus，in- + nocuus（有害的）' },
  { word: 'insatiable', phonetic: '/ɪnˈseɪʃəbl/', partOfSpeech: 'adj.', definition: '贪得无厌的；无法满足的', example: 'He has an insatiable appetite for knowledge.', exampleZh: '他有对知识的无限渴求。', etymology: '拉丁语 insatiabilis，in- + satiare（满足）' },
  { word: 'insidious', phonetic: '/ɪnˈsɪdiəs/', partOfSpeech: 'adj.', definition: '阴险的；隐伏的；狡猾的', example: 'The disease is insidious.', exampleZh: '这种疾病是隐伏的。', etymology: '拉丁语 insidiosus，insidiae（伏击）' },
  { word: 'integrate', phonetic: '/ˈɪntɪɡreɪt/', partOfSpeech: 'v.', definition: '整合；融入；使完整', example: 'We need to integrate the systems.', exampleZh: '我们需要整合系统。', etymology: '拉丁语 integrare，integer（完整的）' },
  { word: 'integrity', phonetic: '/ɪnˈteɡrəti/', partOfSpeech: 'n.', definition: '正直；诚实；完整性', example: 'She is a woman of integrity.', exampleZh: '她是一位正直的女性。', etymology: '拉丁语 integritas，来自 integer（完整的）' },
  { word: 'intensify', phonetic: '/ɪnˈtensɪfaɪ/', partOfSpeech: 'v.', definition: '加强；加剧；强化', example: 'The storm intensified overnight.', exampleZh: '风暴在夜间加剧了。', etymology: '拉丁语 intens-（伸展的）+ -fy' },
  { word: 'intricate', phonetic: '/ˈɪntrɪkət/', partOfSpeech: 'adj.', definition: '复杂的；错综的；精细的', example: 'The design is intricate.', exampleZh: '设计很复杂。', etymology: '拉丁语 intricare，in- + tricae（纠缠）' },
  { word: 'intrinsic', phonetic: '/ɪnˈtrɪnzɪk/', partOfSpeech: 'adj.', definition: '固有的；内在的；本质的', example: 'The painting has intrinsic value.', exampleZh: '这幅画有内在价值。', etymology: '拉丁语 intrinsecus（向内）' },
  { word: 'intuitive', phonetic: '/ɪnˈtjuːɪtɪv/', partOfSpeech: 'adj.', definition: '直觉的；直观的；易懂的', example: 'The interface is intuitive.', exampleZh: '界面很直观。', etymology: '拉丁语 intueri（注视）' },
  { word: 'inundate', phonetic: '/ˈɪnʌndeɪt/', partOfSpeech: 'v.', definition: '淹没；使不胜负荷；泛滥', example: 'We were inundated with requests.', exampleZh: '我们被请求淹没了。', etymology: '拉丁语 inundare，in- + unda（波浪）' },
  { word: 'invoke', phonetic: '/ɪnˈvoʊk/', partOfSpeech: 'v.', definition: '调用；祈求；援引', example: 'He invoked the Fifth Amendment.', exampleZh: '他援引了第五修正案。', etymology: '拉丁语 invocare，in- + vocare（呼叫）' },
  { word: 'irascible', phonetic: '/ɪˈræsəbl/', partOfSpeech: 'adj.', definition: '易怒的；暴躁的', example: 'He was known to be irascible.', exampleZh: '他以易怒著称。', etymology: '拉丁语 irascibilis，ira（愤怒）' },
  { word: 'ironic', phonetic: '/aɪˈrɒnɪk/', partOfSpeech: 'adj.', definition: '讽刺的；具有讽刺意味的', example: 'It was ironic that he was late.', exampleZh: '他迟到了真是讽刺。', etymology: '希腊语 eirōnikos（假装无知的）' },
  { word: 'irrevocable', phonetic: '/ɪˈrevəkəbl/', partOfSpeech: 'adj.', definition: '不可撤销的；不可改变的', example: 'The decision is irrevocable.', exampleZh: '决定是不可撤销的。', etymology: '拉丁语 irrevocabilis，ir- + revocare（召回）' },
  { word: 'jubilant', phonetic: '/ˈdʒuːbɪlənt/', partOfSpeech: 'adj.', definition: '欢欣鼓舞的；喜气洋洋的', example: 'The fans were jubilant after the win.', exampleZh: '获胜后球迷们欣喜若狂。', etymology: '拉丁语 jubilare（欢呼）' },
  { word: 'judicious', phonetic: '/dʒuːˈdɪʃəs/', partOfSpeech: 'adj.', definition: '明智的；审慎的；有见识的', example: 'She made a judicious choice.', exampleZh: '她做出了明智的选择。', etymology: '拉丁语 judiciosus，judicium（判断）' },
  { word: 'juxtapose', phonetic: '/ˌdʒʌkstəˈpoʊz/', partOfSpeech: 'v.', definition: '并列；并置；对比', example: 'The exhibit juxtaposes old and new art.', exampleZh: '展览将新旧艺术并列展示。', etymology: '拉丁语 juxta（靠近）+ poser（放置）' },
  { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', partOfSpeech: 'n.', definition: '知识；学问；了解', example: 'Knowledge is power.', exampleZh: '知识就是力量。', etymology: '古英语 cnawlece，cnawan（知道）' },
  { word: 'laconic', phonetic: '/ləˈkɒnɪk/', partOfSpeech: 'adj.', definition: '简洁的；言简意赅的', example: 'His reply was laconic.', exampleZh: '他的回答很简洁。', etymology: '希腊语 Lakōnikos，来自 Laconia（斯巴达地区）' },
  { word: 'legitimate', phonetic: '/lɪˈdʒɪtɪmət/', partOfSpeech: 'adj.', definition: '合法的；正当的；合理的', example: 'She has a legitimate claim.', exampleZh: '她有正当的权利主张。', etymology: '拉丁语 legitimus，lex（法律）' },
  { word: 'lethargic', phonetic: '/ləˈθɑːrdʒɪk/', partOfSpeech: 'adj.', definition: '昏昏欲睡的；无精打采的', example: 'The heat made everyone lethargic.', exampleZh: '高温使每个人无精打采。', etymology: '希腊语 lēthargikos，lēthē（遗忘）+ argia（不活动）' },
  { word: 'lucid', phonetic: '/ˈluːsɪd/', partOfSpeech: 'adj.', definition: '清晰的；明了的；头脑清醒的', example: 'She gave a lucid explanation.', exampleZh: '她给出了清晰的解释。', etymology: '拉丁语 lucidus，lux（光）' },
  { word: 'lucrative', phonetic: '/ˈluːkrətɪv/', partOfSpeech: 'adj.', definition: '有利可图的；赚钱的', example: 'The business is very lucrative.', exampleZh: '生意非常赚钱。', etymology: '拉丁语 lucrativus，lucrum（利润）' },
  { word: 'magnificent', phonetic: '/mæɡˈnɪfɪsnt/', partOfSpeech: 'adj.', definition: '壮丽的；宏伟的；极好的', example: 'The view from the top is magnificent.', exampleZh: '山顶的景色壮丽极了。', etymology: '拉丁语 magnificus，magnus（大的）+ facere（做）' },
  { word: 'malicious', phonetic: '/məˈlɪʃəs/', partOfSpeech: 'adj.', definition: '恶意的；恶毒的；蓄意的', example: 'The attack was malicious.', exampleZh: '攻击是恶意的。', etymology: '拉丁语 malitiosus，malus（坏的）' },
  { word: 'malleable', phonetic: '/ˈmæliəbl/', partOfSpeech: 'adj.', definition: '可塑的；易改变的；有延展性的', example: 'Gold is a malleable metal.', exampleZh: '金是一种有延展性的金属。', etymology: '拉丁语 malleus（锤子），可被锤打' },
  { word: 'mandate', phonetic: '/ˈmændeɪt/', partOfSpeech: 'n./v.', definition: '授权；命令；委托', example: 'The government has a mandate to reform.', exampleZh: '政府有改革的授权。', etymology: '拉丁语 mandatum，mandare（命令）' },
  { word: 'meticulous', phonetic: '/məˈtɪkjələs/', partOfSpeech: 'adj.', definition: '一丝不苟的；细致的；拘泥的', example: 'She is meticulous in her work.', exampleZh: '她工作一丝不苟。', etymology: '拉丁语 meticulosus，metus（恐惧），引申为过分小心' },
  { word: 'mitigate', phonetic: '/ˈmɪtɪɡeɪt/', partOfSpeech: 'v.', definition: '减轻；缓和；缓解', example: 'Steps were taken to mitigate the damage.', exampleZh: '采取了措施来减轻损害。', etymology: '拉丁语 mitigare，mitis（温和的）+ agere（做）' },
  { word: 'mundane', phonetic: '/mʌnˈdeɪn/', partOfSpeech: 'adj.', definition: '平凡的；世俗的；日常的', example: 'He was tired of mundane tasks.', exampleZh: '他厌倦了平凡的任务。', etymology: '拉丁语 mundanus，来自 mundus（世界）' },
  { word: 'negate', phonetic: '/nɪˈɡeɪt/', partOfSpeech: 'v.', definition: '否定；否认；使无效', example: 'The evidence negates his claim.', exampleZh: '证据否定了他的说法。', etymology: '拉丁语 negare（否认），nec-（不）+ aire（说）' },
  { word: 'negotiate', phonetic: '/nɪˈɡoʊʃieɪt/', partOfSpeech: 'v.', definition: '谈判；协商；商定', example: 'We need to negotiate the terms.', exampleZh: '我们需要协商条款。', etymology: '拉丁语 negotiari，nec- + otium（闲暇）' },
  { word: 'nonchalant', phonetic: '/ˌnɒnʃəˈlɑːnt/', partOfSpeech: 'adj.', definition: '漫不经心的；冷淡的；淡定的', example: 'He appeared nonchalant about the news.', exampleZh: '他对这个消息显得漫不经心。', etymology: '法语 nonchalant，non- + chaloir（在乎）' },
  { word: 'notorious', phonetic: '/noʊˈtɔːriəs/', partOfSpeech: 'adj.', definition: '臭名昭著的；众所周知的', example: 'The area is notorious for crime.', exampleZh: '该地区因犯罪而臭名昭著。', etymology: '拉丁语 notorius，notus（已知的）' },
  { word: 'novice', phonetic: '/ˈnɒvɪs/', partOfSpeech: 'n.', definition: '新手；初学者；见习修士', example: 'She is a novice at cooking.', exampleZh: '她是烹饪新手。', etymology: '拉丁语 novicius，novus（新的）' },
  { word: 'obscure', phonetic: '/əbˈskjʊər/', partOfSpeech: 'adj./v.', definition: '模糊的；晦涩的；使模糊', example: 'The meaning is obscure.', exampleZh: '含义模糊不清。', etymology: '拉丁语 obscurus（暗的）' },
  { word: 'obsolete', phonetic: '/ˌɒbsəˈliːt/', partOfSpeech: 'adj.', definition: '过时的；废弃的；淘汰的', example: 'The technology is now obsolete.', exampleZh: '该技术现已过时。', etymology: '拉丁语 obsoletus，ob- + solere（习惯）' },
  { word: 'obstacle', phonetic: '/ˈɒbstəkl/', partOfSpeech: 'n.', definition: '障碍；阻碍；绊脚石', example: 'Lack of money is the main obstacle.', exampleZh: '缺钱是主要的障碍。', etymology: '拉丁语 obstaculum，obstare（阻挡）' },
  { word: 'obstinate', phonetic: '/ˈɒbstɪnət/', partOfSpeech: 'adj.', definition: '固执的；倔强的；难以对付的', example: 'He is obstinate in his views.', exampleZh: '他在观点上很固执。', etymology: '拉丁语 obstinatus，ob- + stare（站立）' },
  { word: 'ominous', phonetic: '/ˈɒmɪnəs/', partOfSpeech: 'adj.', definition: '不祥的；不吉利的；预兆的', example: 'There was an ominous silence.', exampleZh: '有一种不祥的寂静。', etymology: '拉丁语 ominosus，omen（预兆）' },
  { word: 'omnipotent', phonetic: '/ɒmˈnɪpətənt/', partOfSpeech: 'adj.', definition: '全能的；无所不能的', example: 'No one is omnipotent.', exampleZh: '没有人是全能的。', etymology: '拉丁语 omnipotens，omni- + potens（强大的）' },
  { word: 'opulent', phonetic: '/ˈɒpjələnt/', partOfSpeech: 'adj.', definition: '富裕的；豪华的；丰富的', example: 'They lived in an opulent mansion.', exampleZh: '他们住在豪华的宅邸中。', etymology: '拉丁语 opulentus，ops（财富）' },
  { word: 'paradox', phonetic: '/ˈpærədɒks/', partOfSpeech: 'n.', definition: '悖论；矛盾的人或事', example: 'It is a paradox that the busiest people find the most time.', exampleZh: '最忙的人反而最有时间，这是一个悖论。', etymology: '希腊语 paradoxon，para- + doxa（意见）' },
  { word: 'paramount', phonetic: '/ˈpærəmaʊnt/', partOfSpeech: 'adj.', definition: '至高无上的；最重要的', example: 'Safety is paramount.', exampleZh: '安全是首要的。', etymology: '盎格鲁-法语 paramont（在上方）' },
  { word: 'penchant', phonetic: '/ˈpentʃənt/', partOfSpeech: 'n.', definition: '爱好；嗜好；倾向', example: 'She has a penchant for adventure.', exampleZh: '她有冒险的爱好。', etymology: '法语 penchant，pendre（悬挂）的现在分词' },
  { word: 'perceptive', phonetic: '/pərˈseptɪv/', partOfSpeech: 'adj.', definition: '洞察力强的；敏锐的；知觉的', example: 'She is very perceptive.', exampleZh: '她非常有洞察力。', etymology: '拉丁语 perceptivus，percipere（感知）' },
  { word: 'perennial', phonetic: '/pəˈreniəl/', partOfSpeech: 'adj.', definition: '常年的；永恒的；反复出现的', example: 'This is a perennial problem.', exampleZh: '这是一个反复出现的问题。', etymology: '拉丁语 perennis，per- + annus（年）' },
  { word: 'perfidious', phonetic: '/pərˈfɪdiəs/', partOfSpeech: 'adj.', definition: '背信弃义的；不忠的', example: 'The perfidious ally betrayed them.', exampleZh: '不忠的盟友背叛了他们。', etymology: '拉丁语 perfidiosus，perfidia（不忠）' },
  { word: 'permeate', phonetic: '/ˈpɜːrmieɪt/', partOfSpeech: 'v.', definition: '渗透；弥漫；遍布', example: 'The smell permeated the room.', exampleZh: '气味弥漫了整个房间。', etymology: '拉丁语 permeare，per- + meare（通过）' },
  { word: 'persevere', phonetic: '/ˌpɜːrsɪˈvɪr/', partOfSpeech: 'v.', definition: '坚持；不屈不挠', example: 'You must persevere with your studies.', exampleZh: '你必须坚持学习。', etymology: '拉丁语 perseverare，per- + severus（严格的）' },
  { word: 'pertinent', phonetic: '/ˈpɜːrtɪnənt/', partOfSpeech: 'adj.', definition: '相关的；中肯的；切题的', example: 'Please keep your remarks pertinent.', exampleZh: '请使你的发言切题。', etymology: '拉丁语 pertinens，pertinere（涉及）' },
  { word: 'pervasive', phonetic: '/pərˈveɪsɪv/', partOfSpeech: 'adj.', definition: '普遍的；渗透的；遍布的', example: 'The influence of social media is pervasive.', exampleZh: '社交媒体的影响无处不在。', etymology: '拉丁语 pervadere（蔓延）' },
  { word: 'phenomenon', phonetic: '/fɪˈnɒmɪnən/', partOfSpeech: 'n.', definition: '现象；非凡的人或事', example: 'The phenomenon is well documented.', exampleZh: '该现象有充分的记录。', etymology: '希腊语 phainomenon（显现的事物）' },
  { word: 'plausible', phonetic: '/ˈplɔːzəbl/', partOfSpeech: 'adj.', definition: '貌似合理的；似乎可信的', example: 'His excuse sounded plausible.', exampleZh: '他的借口听起来可信。', etymology: '拉丁语 plausibilis，plaudere（鼓掌）' },
  { word: 'plethora', phonetic: '/ˈpleθərə/', partOfSpeech: 'n.', definition: '过多；过剩；大量', example: 'There is a plethora of options.', exampleZh: '有太多的选择。', etymology: '希腊语 plēthōra（充满）' },
  { word: 'pragmatic', phonetic: '/præɡˈmætɪk/', partOfSpeech: 'adj.', definition: '务实的；实用主义的', example: 'We need a pragmatic approach.', exampleZh: '我们需要务实的方法。', etymology: '希腊语 pragmatikos，pragma（事务）' },
  { word: 'precarious', phonetic: '/prɪˈkeəriəs/', partOfSpeech: 'adj.', definition: '不稳定的；危险的；不确定的', example: 'His position is precarious.', exampleZh: '他的地位不稳固。', etymology: '拉丁语 precarius，prex（祈祷）' },
  { word: 'preclude', phonetic: '/prɪˈkluːd/', partOfSpeech: 'v.', definition: '排除；阻止；妨碍', example: 'Lack of funds precludes the project.', exampleZh: '缺乏资金阻止了项目。', etymology: '拉丁语 praecludere，prae- + claudere（关闭）' },
  { word: 'predicament', phonetic: '/prɪˈdɪkəmənt/', partOfSpeech: 'n.', definition: '困境；窘境', example: 'She found herself in a predicament.', exampleZh: '她发现自己陷入了困境。', etymology: '拉丁语 praedicamentum（类别），后引申为困境' },
  { word: 'predominant', phonetic: '/prɪˈdɒmɪnənt/', partOfSpeech: 'adj.', definition: '主要的；占优势的；显著的', example: 'Yellow is the predominant color.', exampleZh: '黄色是主要颜色。', etymology: '拉丁语 predominari，prae- + dominari（统治）' },
  { word: 'prevalent', phonetic: '/ˈprevələnt/', partOfSpeech: 'adj.', definition: '流行的；普遍的；盛行的', example: 'The disease is prevalent in the region.', exampleZh: '该疾病在该地区很流行。', etymology: '拉丁语 praevalere（更强大）' },
  { word: 'pristine', phonetic: '/ˈprɪstiːn/', partOfSpeech: 'adj.', definition: '原始的；崭新的；纯净的', example: 'The beach was pristine.', exampleZh: '海滩原始纯净。', etymology: '拉丁语 pristinus（从前的，原始的）' },
  { word: 'probity', phonetic: '/ˈproʊbəti/', partOfSpeech: 'n.', definition: '正直；诚实；廉洁', example: 'His probity is beyond question.', exampleZh: '他的正直毋庸置疑。', etymology: '拉丁语 probitas，probus（好的）' },
  { word: 'profound', phonetic: '/prəˈfaʊnd/', partOfSpeech: 'adj.', definition: '深刻的；深远的；渊博的', example: 'The book had a profound impact.', exampleZh: '这本书产生了深远的影响。', etymology: '拉丁语 profundus（深的）' },
  { word: 'proliferate', phonetic: '/prəˈlɪfəreɪt/', partOfSpeech: 'v.', definition: '激增；扩散；繁殖', example: 'Social media platforms have proliferated.', exampleZh: '社交媒体平台激增。', etymology: '拉丁语 proles（后代）+ ferre（产生）' },
  { word: 'propensity', phonetic: '/prəˈpensəti/', partOfSpeech: 'n.', definition: '倾向；习性；偏好', example: 'He has a propensity for exaggeration.', exampleZh: '他有夸大的倾向。', etymology: '拉丁语 propensus，pro- + pendere（悬挂）' },
  { word: 'proponent', phonetic: '/prəˈpoʊnənt/', partOfSpeech: 'n.', definition: '支持者；拥护者；倡导者', example: 'She is a proponent of renewable energy.', exampleZh: '她是可再生能源的支持者。', etymology: '拉丁语 proponere（提出）' },
  { word: 'prosaic', phonetic: '/proʊˈzeɪɪk/', partOfSpeech: 'adj.', definition: '平淡的；乏味的；散文的', example: 'The reality was more prosaic.', exampleZh: '现实更加平淡。', etymology: '晚期拉丁语 prosaicus，prosa（散文）' },
  { word: 'provoke', phonetic: '/prəˈvoʊk/', partOfSpeech: 'v.', definition: '激怒；挑衅；引起', example: 'His comments provoked a reaction.', exampleZh: '他的评论引起了反应。', etymology: '拉丁语 provocare，pro- + vocare（呼叫）' },
  { word: 'prudent', phonetic: '/ˈpruːdnt/', partOfSpeech: 'adj.', definition: '谨慎的；精明的；深谋远虑的', example: 'It would be prudent to wait.', exampleZh: '等待是明智的。', etymology: '拉丁语 prudens，pro- + videre（预见）' },
  { word: 'quarantine', phonetic: '/ˈkwɒrəntiːn/', partOfSpeech: 'n./v.', definition: '隔离；检疫', example: 'The patient was put in quarantine.', exampleZh: '该病人被隔离了。', etymology: '意大利语 quarantina（四十天），quaranta（四十）' },
  { word: 'quell', phonetic: '/kwel/', partOfSpeech: 'v.', definition: '平息；镇压；消除', example: 'The government quelled the rebellion.', exampleZh: '政府镇压了叛乱。', etymology: '古英语 cwellan（杀死）' },
  { word: 'quintessential', phonetic: '/ˌkwɪntɪˈsenʃl/', partOfSpeech: 'adj.', definition: '典型的；精髓的；完美的体现', example: 'He is the quintessential gentleman.', exampleZh: '他是典型的绅士。', etymology: '拉丁语 quinta essentia（第五元素）' },
  { word: 'ramification', phonetic: '/ˌræmɪfɪˈkeɪʃn/', partOfSpeech: 'n.', definition: '后果；衍生结果；分支', example: 'The ramifications of the decision are unclear.', exampleZh: '决定的后果尚不清楚。', etymology: '拉丁语 ramificare，ramus（分支）' },
  { word: 'rampant', phonetic: '/ˈræmpənt/', partOfSpeech: 'adj.', definition: '猖獗的；蔓延的；失控的', example: 'Corruption is rampant.', exampleZh: '腐败猖獗。', etymology: '古法语 rampant，ramper（爬行）' },
  { word: 'recalcitrant', phonetic: '/rɪˈkælsɪtrənt/', partOfSpeech: 'adj.', definition: '顽抗的；不服从的；执拗的', example: 'The recalcitrant student refused to obey.', exampleZh: '那个顽抗的学生拒绝服从。', etymology: '拉丁语 recalcitrare，re- + calcitrare（踢）' },
  { word: 'reconcile', phonetic: '/ˈrekənsaɪl/', partOfSpeech: 'v.', definition: '调和；和解；使一致', example: 'They reconciled their differences.', exampleZh: '他们调和了分歧。', etymology: '拉丁语 reconciliare，re- + conciliare（使联合）' },
  { word: 'redundant', phonetic: '/rɪˈdʌndənt/', partOfSpeech: 'adj.', definition: '多余的；冗余的；被裁减的', example: 'The sentence contains redundant words.', exampleZh: '句子包含多余的词。', etymology: '拉丁语 redundare（溢出）' },
  { word: 'resilient', phonetic: '/rɪˈzɪliənt/', partOfSpeech: 'adj.', definition: '有弹性的；能迅速恢复的；适应力强的', example: 'Children are often very resilient.', exampleZh: '孩子们通常适应力很强。', etymology: '拉丁语 resilire（跳回），re- + salire（跳）' },
  { word: 'resolute', phonetic: '/ˈrezəluːt/', partOfSpeech: 'adj.', definition: '坚决的；果断的；坚定的', example: 'She was resolute in her determination.', exampleZh: '她决心坚定。', etymology: '拉丁语 resolvere（解开），过去分词 resolutus' },
  { word: 'revere', phonetic: '/rɪˈvɪər/', partOfSpeech: 'v.', definition: '尊敬；崇敬；敬畏', example: 'He is revered as a hero.', exampleZh: '他被尊为英雄。', etymology: '拉丁语 revereri，re- + vereri（敬畏）' },
  { word: 'sagacious', phonetic: '/səˈɡeɪʃəs/', partOfSpeech: 'adj.', definition: '睿智的；精明的；有远见的', example: 'She made a sagacious decision.', exampleZh: '她做出了明智的决定。', etymology: '拉丁语 sagax（敏锐的）' },
  { word: 'sanctify', phonetic: '/ˈsæŋktɪfaɪ/', partOfSpeech: 'v.', definition: '使神圣；使圣洁；尊崇', example: 'The ritual sanctifies the space.', exampleZh: '仪式使空间神圣化。', etymology: '拉丁语 sanctificare，sanctus（神圣的）+ facere（做）' },
  { word: 'scrutinize', phonetic: '/ˈskruːtənaɪz/', partOfSpeech: 'v.', definition: '仔细检查；审查；细察', example: 'The committee scrutinized the proposal.', exampleZh: '委员会仔细审查了提案。', etymology: '拉丁语 scrutari（搜索）' },
  { word: 'sedulous', phonetic: '/ˈsedjələs/', partOfSpeech: 'adj.', definition: '勤勉的；坚持不懈的', example: 'She was sedulous in her efforts.', exampleZh: '她努力不懈。', etymology: '拉丁语 sedulus（细心的）' },
  { word: 'sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/', partOfSpeech: 'adj.', definition: '精密的；复杂的；老练的', example: 'This is a sophisticated system.', exampleZh: '这是一个精密的系统。', etymology: '希腊语 sophistikos（诡辩的），后引申为精密的' },
  { word: 'sporadic', phonetic: '/spəˈrædɪk/', partOfSpeech: 'adj.', definition: '零星的；偶尔的；断断续续的', example: 'There were sporadic outbreaks of violence.', exampleZh: '有零星的暴力事件。', etymology: '希腊语 sporadikos，spora（种子）' },
  { word: 'substantiate', phonetic: '/səbˈstænʃieɪt/', partOfSpeech: 'v.', definition: '证实；证明；使实体化', example: 'Can you substantiate your claims?', exampleZh: '你能证实你的说法吗？', etymology: '拉丁语 substantiare，substantia（实质）' },
  { word: 'supersede', phonetic: '/ˌsuːpərˈsiːd/', partOfSpeech: 'v.', definition: '取代；替代；接替', example: 'The new law supersedes the old one.', exampleZh: '新法律取代了旧法律。', etymology: '拉丁语 supersedere，super- + sedere（坐）' },
  { word: 'supplant', phonetic: '/səˈplænt/', partOfSpeech: 'v.', definition: '取代；排挤；篡夺', example: 'Technology supplanted manual labor.', exampleZh: '技术取代了手工劳动。', etymology: '古法语 supplanter，拉丁语 supplantare（绊倒）' },
  { word: 'surpass', phonetic: '/sərˈpæs/', partOfSpeech: 'v.', definition: '超越；胜过；超过', example: 'She surpassed all expectations.', exampleZh: '她超越了所有期望。', etymology: '古法语 surpasser，sur- + passer（通过）' },
  { word: 'tenacious', phonetic: '/tɪˈneɪʃəs/', partOfSpeech: 'adj.', definition: '坚韧的；顽强的；执着的', example: 'She is a tenacious negotiator.', exampleZh: '她是一位顽强的谈判者。', etymology: '拉丁语 tenax，tenere（持有）' },
  { word: 'tentative', phonetic: '/ˈtentətɪv/', partOfSpeech: 'adj.', definition: '暂定的；试探性的；犹豫的', example: 'We made tentative plans.', exampleZh: '我们制定了暂定计划。', etymology: '拉丁语 tentativus，tentare（尝试）' },
  { word: 'trepidation', phonetic: '/ˌtrepɪˈdeɪʃn/', partOfSpeech: 'n.', definition: '不安；恐惧；颤抖', example: 'She faced the exam with trepidation.', exampleZh: '她怀着不安面对考试。', etymology: '拉丁语 trepidatio，trepidare（颤抖）' },
  { word: 'turbulent', phonetic: '/ˈtɜːrbjələnt/', partOfSpeech: 'adj.', definition: '动荡的；混乱的；湍急的', example: 'The country went through a turbulent period.', exampleZh: '国家经历了动荡时期。', etymology: '拉丁语 turbulentus，turba（混乱）' },
  { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', partOfSpeech: 'adj.', definition: '无处不在的；普遍存在的', example: 'Smartphones are ubiquitous nowadays.', exampleZh: '如今智能手机无处不在。', etymology: '拉丁语 ubique（到处）' },
  { word: 'unprecedented', phonetic: '/ʌnˈpresɪdentɪd/', partOfSpeech: 'adj.', definition: '前所未有的；空前的；史无前例的', example: 'The event was unprecedented.', exampleZh: '该事件是前所未有的。', etymology: 'un- + precedent（先例）' },
  { word: 'utilitarian', phonetic: '/ˌjuːtɪlɪˈteəriən/', partOfSpeech: 'adj.', definition: '功利主义的；实用的', example: 'The design is utilitarian.', exampleZh: '设计是实用主义的。', etymology: '拉丁语 utilis（有用的）' },
  { word: 'validate', phonetic: '/ˈvælɪdeɪt/', partOfSpeech: 'v.', definition: '验证；确认；使生效', example: 'We need to validate the results.', exampleZh: '我们需要验证结果。', etymology: '拉丁语 validus（强壮的）' },
  { word: 'venerate', phonetic: '/ˈvenəreɪt/', partOfSpeech: 'v.', definition: '崇敬；尊敬；敬仰', example: 'They venerate their ancestors.', exampleZh: '他们崇敬祖先。', etymology: '拉丁语 venerari，venus（魅力）' },
  { word: 'versatile', phonetic: '/ˈvɜːrsətaɪl/', partOfSpeech: 'adj.', definition: '多才多艺的；多用途的；灵活的', example: 'She is a versatile performer.', exampleZh: '她是一位多才多艺的表演者。', etymology: '拉丁语 versatilis，vertere（转动）' },
  { word: 'vigilant', phonetic: '/ˈvɪdʒɪlənt/', partOfSpeech: 'adj.', definition: '警惕的；警觉的；留心的', example: 'We must remain vigilant.', exampleZh: '我们必须保持警惕。', etymology: '拉丁语 vigilans，vigilare（保持清醒）' },
  { word: 'volatile', phonetic: '/ˈvɒlətaɪl/', partOfSpeech: 'adj.', definition: '易变的；不稳定的；挥发性的', example: 'The stock market is volatile.', exampleZh: '股市波动不定。', etymology: '拉丁语 volatilis，volare（飞）' },
  { word: 'vulnerable', phonetic: '/ˈvʌlnərəbl/', partOfSpeech: 'adj.', definition: '脆弱的；易受伤的', example: 'Old people are more vulnerable to illness.', exampleZh: '老人更容易受疾病侵袭。', etymology: '拉丁语 vulnerabilis，vulnus（伤口）' },
  { word: 'wary', phonetic: '/ˈweəri/', partOfSpeech: 'adj.', definition: '小心的；谨慎的；警惕的', example: 'She was wary of strangers.', exampleZh: '她对陌生人很警惕。', etymology: '古英语 wær（谨慎的）' },
  { word: 'whimsical', phonetic: '/ˈwɪmzɪkl/', partOfSpeech: 'adj.', definition: '异想天开的；古怪的；反复无常的', example: 'The story has a whimsical charm.', exampleZh: '故事有一种异想天开的魅力。', etymology: 'whim（奇想）+ -sical' },
  { word: 'wisdom', phonetic: '/ˈwɪzdəm/', partOfSpeech: 'n.', definition: '智慧；才智；明智', example: 'Experience brings wisdom.', exampleZh: '经验带来智慧。', etymology: '古英语 wīsdōm，wīs（聪明的）' },
  { word: 'zealous', phonetic: '/ˈzeləs/', partOfSpeech: 'adj.', definition: '热情的；热心的；积极的', example: 'She is a zealous advocate.', exampleZh: '她是一位热心的倡导者。', etymology: '希腊语 zēlos（热情）' },
]

export default function Dictionary() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<DictEntry | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const cardBg = isDark ? '#16213e' : '#fff'

  const filtered = useMemo(() => {
    if (!query.trim()) return dictionary.slice(0, 50)
    const q = query.toLowerCase().trim()
    return dictionary.filter(
      (d) =>
        d.word.toLowerCase().startsWith(q) ||
        d.word.toLowerCase().includes(q) ||
        d.definition.includes(q)
    )
  }, [query])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().trim()
    return dictionary
      .filter(d => d.word.toLowerCase().startsWith(q) && d.word.toLowerCase() !== q)
      .slice(0, 8)
      .map(d => d.word)
  }, [query])

  const speak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
    }
  }

  const selectWord = (entry: DictEntry) => {
    setSelected(entry)
    setSearchHistory(prev => {
      const next = [entry.word, ...prev.filter(w => w !== entry.word)]
      return next.slice(0, 20)
    })
    setShowHistory(false)
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 240, background: isDark ? '#16213e' : '#e8e8e8', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10, position: 'relative' }}>
          <input
            type="text" placeholder="搜索单词或释义..." value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); setShowHistory(false) }}
            onFocus={() => { if (!query) setShowHistory(true) }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
          {suggestions.length > 0 && query && (
            <div style={{
              position: 'absolute', top: 42, left: 10, right: 10, zIndex: 20,
              background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 6,
              maxHeight: 200, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {suggestions.map(s => (
                <div key={s} onClick={() => { setQuery(s); const entry = dictionary.find(d => d.word === s); if (entry) selectWord(entry) }}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${borderColor}` }}>
                  {s}
                </div>
              ))}
            </div>
          )}
          {showHistory && searchHistory.length > 0 && !query && (
            <div style={{
              position: 'absolute', top: 42, left: 10, right: 10, zIndex: 20,
              background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 6,
              maxHeight: 200, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              <div style={{ padding: '6px 10px', fontSize: 10, color: isDark ? '#6b7280' : '#999', fontWeight: 600 }}>搜索历史</div>
              {searchHistory.map(w => (
                <div key={w} onClick={() => { const entry = dictionary.find(d => d.word === w); if (entry) selectWord(entry); setShowHistory(false) }}
                  style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12, borderBottom: `1px solid ${borderColor}` }}>
                  🕐 {w}
                </div>
              ))}
              <div onClick={() => { setSearchHistory([]); setShowHistory(false) }}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: '#f38ba8', textAlign: 'center' }}>
                清除历史
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((d) => (
            <div key={d.word} onClick={() => selectWord(d)} style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`,
              background: selected?.word === d.word ? (isDark ? '#0f3460' : '#c8e6c9') : 'transparent',
              borderLeft: selected?.word === d.word ? `3px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : '3px solid transparent',
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.word}</div>
              <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888' }}>{d.partOfSpeech} {d.definition}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: isDark ? '#6b7280' : '#999', fontSize: 12 }}>
              未找到匹配的单词
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }} onClick={() => setShowHistory(false)}>
        {selected ? (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 28, color: isDark ? '#4fc3f7' : '#1976d2' }}>{selected.word}</h2>
              <button onClick={() => speak(selected.word)} style={{
                width: 36, height: 36, borderRadius: '50%', border: `1px solid ${borderColor}`,
                background: cardBg, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><VolumeIcon /></button>
            </div>

            <div style={{ fontSize: 16, color: isDark ? '#9ca3af' : '#666', marginBottom: 16 }}>{selected.phonetic}</div>

            <div style={{ background: cardBg, borderRadius: 10, padding: 16, border: `1px solid ${borderColor}`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: isDark ? '#4fc3f7' : '#1976d2', fontWeight: 600, marginBottom: 6 }}>{selected.partOfSpeech}</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>{selected.definition}</div>
              <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888', marginBottom: 4 }}>例句</div>
                <div style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 4 }}>{selected.example}</div>
                <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#666' }}>{selected.exampleZh}</div>
              </div>
            </div>

            <div style={{ background: cardBg, borderRadius: 10, padding: 16, border: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 11, color: isDark ? '#a6e3a1' : '#2e7d32', fontWeight: 600, marginBottom: 6 }}>📖 词源</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{selected.etymology}</div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>英汉词典</div>
            <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#888' }}>
              输入单词或释义进行搜索，或从左侧列表中浏览词汇
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: isDark ? '#6b7280' : '#aaa' }}>
              共收录 {dictionary.length} 个常用词汇
            </div>
            {searchHistory.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#888', marginBottom: 8 }}>最近搜索</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {searchHistory.slice(0, 10).map(w => (
                    <span key={w} onClick={() => { const entry = dictionary.find(d => d.word === w); if (entry) selectWord(entry) }}
                      style={{
                        padding: '4px 10px', background: isDark ? '#0f3460' : '#e3f2fd',
                        borderRadius: 12, cursor: 'pointer', fontSize: 12,
                      }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
