export const TOPICS = [
  "描述一次你成功解決困難問題的經驗。",
  "你認為遠距工作是未來的趨勢嗎？請說明原因。",
  "介紹一本你最喜歡的書或一部電影，並說明為何推薦它。",
  "在團隊合作中，如果你與同事意見不合，你會如何處理？",
  "如果可以改變世界上的一件事，你會改變什麼？為什麼？",
  "分享一個你最近學到的新技能，以及學習過程中的體悟。",
  "請描述你心目中理想的領導者應該具備哪些特質。",
  "如果給你無限的預算創業，你會做什麼樣的生意？",
  "你覺得人工智慧會取代大多數人的工作嗎？",
  "談談「失敗是成功之母」這句話，並結合理論與自身經驗。"
];

export function getRandomTopic(): string {
  const randomIndex = Math.floor(Math.random() * TOPICS.length);
  return TOPICS[randomIndex];
}
