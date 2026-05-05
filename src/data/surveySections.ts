export const SURVEY_SECTIONS = [
  {
    title: '第一部分：小組討論 (Group Discussions)',
    questions: [
      { id: 1, text: '在參加小組討論時，我感到非常放鬆。' },
      { id: 2, text: '在小組討論中，我通常不擔心表達自己的意見。' },
      { id: 3, text: '當我必須在小組討論中說話時，我會感到緊張和困擾。' },
      { id: 4, text: '在小組討論中說話時，我感到很平靜。' },
      { id: 5, text: '參與小組討論會讓我感到非常焦慮。' },
      { id: 6, text: '在小組討論中，我感到非常自在。' },
    ]
  },
  {
    title: '第二部分：會議與課堂討論 (Meetings)',
    questions: [
      { id: 7, text: '在參加會議時，我通常感到緊張。' },
      { id: 8, text: '在會議中說話時，我感到非常放鬆。' },
      { id: 9, text: '當我被要求在會議中表達意見時，我感到害怕。' },
      { id: 10, text: '在會議中說話時，我感到很平靜。' },
      { id: 11, text: '在會議中回答問題會讓我感到困擾。' },
      { id: 12, text: '在會議中表達意見時，我感到非常放鬆。' },
    ]
  },
  {
    title: '第三部分：人際對話 (Interpersonal Conversations)',
    questions: [
      { id: 13, text: '在與新認識的人交談時，我感到非常放鬆。' },
      { id: 14, text: '在與他人交談時，我害怕表達自己的想法。' },
      { id: 15, text: '當我與某人單獨交談時，我感到非常緊張。' },
      { id: 16, text: '與他人交談時，我感到非常放鬆。' },
      { id: 17, text: '在與他人對話時，我常感到緊張和焦慮。' },
      { id: 18, text: '與他人交談時，我感到非常自在。' },
    ]
  },
  {
    title: '第四部分：公開演講 (Public Speaking)',
    questions: [
      { id: 19, text: '我有信心面對群眾做公開演講。' },
      { id: 20, text: '在準備演講時，我感到非常緊張。' },
      { id: 21, text: '在演講過程中，我感到非常放鬆。' },
      { id: 22, text: '當我開始演講時，我的思想常會變得一片混亂。' },
      { id: 23, text: '我發現自己在演講時會感到恐懼。' },
      { id: 24, text: '演講時，我感到非常愉快且有自信。' },
    ]
  }
];

export const calculatePRCAScores = (data: Record<number, number>) => {
  const get = (id: number) => data[id] || 0;

  // Formulas provided by user:
  // 1. Group = 18 - (1) + (2) - (3) + (4) - (5) + (6)
  const group = 18 - get(1) + get(2) - get(3) + get(4) - get(5) + get(6);

  // 2. Meeting = 18 - (7) + (8) + (9) - (10) - (11) + (12)
  const meeting = 18 - get(7) + get(8) + get(9) - get(10) - get(11) + get(12);

  // 3. Dyadic = 18 - (13) + (14) - (15) + (16) + (17) - (18)
  const dyadic = 18 - get(13) + get(14) - get(15) + get(16) + get(17) - get(18);

  // 4. Public = 18 + (19) - (20) + (21) - (22) + (23) - (24)
  const publicScore = 18 + get(19) - get(20) + get(21) - get(22) + get(23) - get(24);

  const total = group + meeting + dyadic + publicScore;

  return { group, meeting, dyadic, publicScore, total };
};