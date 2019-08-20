export class ElAnnos {
  word: string = null;
  items: AnnoItem[] = [];
  note: string = null;
  meaning: AnnoMeaning = null;
  phraseMeaning: AnnoMeaning = null;
}

export class AnnoItem {
  dataName: string;
  dataValue: string;
  text: string;
}

export class AnnoMeaning {
  pos: string;
  mean: string;
  word: string;
  text: string;
}
