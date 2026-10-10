// The offline distribution supplies these same six JSON datasets as a classic script.
export async function loadStudyData() {
  if (globalThis.TOEIC_OFFLINE_DATA) {
    if (!Array.isArray(globalThis.TOEIC_OFFLINE_DATA) || globalThis.TOEIC_OFFLINE_DATA.length !== 6)
      throw Error("离线题库不完整，请重新解压完整离线包。");
    return globalThis.TOEIC_OFFLINE_DATA;
  }
  if (location.protocol === "file:")
    throw Error("请下载电脑离线包，完整解压后打开“开始练习.html”；源码版需要本地服务。");
  const responses = await Promise.all([
    ...Array.from({ length: 4 }, (_, i) => fetch(`data/test${i + 1}.json`)),
    fetch("data/vocabulary.json"),
    fetch("data/audio.json"),
  ]);
  if (responses.some((r) => !r.ok)) throw Error("资料暂时无法加载，请重试。");
  return Promise.all(responses.map((r) => r.json()));
}
