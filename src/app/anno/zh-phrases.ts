export class ZhPhrases {

  private phraseSet: Set<string> = new Set<string>();
  // private phrasePrefixMap: Map<string, string[]> = new Map<>();

  constructor(phrases: string[]) {
    for (let phrase of phrases) {
      this.phraseSet.add(phrase);
      /*if (phrase.length > 2) {
        let prefix = phrase.substr(0, 3);
        let longPhrases = this.phrasePrefixMap.get(prefix);
        if (!longPhrases) {
          longPhrases = [];
          this.phrasePrefixMap.set(prefix, longPhrases);
        }
        longPhrases.push(phrase);
      }*/
    }
  }


  checkIsPhrase(characters: string) {
    return this.phraseSet.has(characters);
  }

}
