export const MILESTONE_MESSAGES = {
  100: 'いい調子！スタートダッシュ成功！',
  200: 'さすがマンドラ！そのペースキープ！',
  300: 'だるまなんて怖くない！',
  400: 'いい感じ！足が軽くなってきた！',
  500: '折り返し地点…じゃない！でも半分超えた！',
  600: '神回避！プロ級の走り！',
  700: 'ラストスパート見えてきた！',
  800: 'あと200m！全力疾走！',
  900: 'ゴール目前！あと一息！',
}

export function getMilestoneMessage(distance) {
  return MILESTONE_MESSAGES[distance] ?? 'ナイスラン！'
}

export function getReachedMilestone(distance) {
  const milestone = Math.floor(distance / 100) * 100
  return milestone >= 100 ? milestone : 0
}

export function getRewardMessageForScore(score) {
  const milestone = getReachedMilestone(score)

  if (milestone === 0) {
    return {
      milestone: 0,
      message: 'また挑戦しよう！次は100m突破！',
    }
  }

  return {
    milestone,
    message: getMilestoneMessage(milestone),
  }
}