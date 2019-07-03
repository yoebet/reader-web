import {environment} from '../environments/environment';

const UIConstants = {
  annotationTagName: 'y-o',
  sentenceTagName: 's-st',
  sentenceIdAttrName: 'sid',
  dropClassPrefix: 'drop-',
  tetherClassPrefix: 'dp-',
  tetherClassPrefixNoHyphen: 'dp',
  highlightClass: 'highlight',
  highlightWordClass: 'highlight-word',
  annoDisabledBodyClass: 'anno-disabled',
  userwordDisabledBodyClass: 'uwf-disabled',
  userWordTagName: 'w-d'
};


const ReaderBgCssClasses = ['reader-bg-wh', 'reader-bg-ly', 'reader-bg-br', 'reader-bg-gr'];

const ReaderStyles = {ReaderBgCssClasses, ReaderBgDefault: 'reader-bg-ly'};


const DataAttrNames = {
  // mid: 'mid',
  pos: 'pos',
  word: 'word',
  mean: 'mean',
  note: 'note',
  assoc: 'assoc',//关联组
  wordFamiliarity: 'uwf'
};

const ValuePhras = ['phra1', 'phra2', 'phra3'];

const DataAttrValues = {
  phraPattern: /^phra\d$/,
  groupPattern: /^group\d$/,
  assocPhra1: ValuePhras[0],
  assocGroups: ValuePhras.concat(['trunk', 'antec', 'group1', 'group2', 'group3']),
  uwfBeyond: '0'
};


const SpecialAnnotations = {
  SelectMeaning: {
    name: '选词义',
    nameEn: 'SelectMeaning'
  },
  AddANote: {
    name: '加注解',
    nameEn: 'AddANote'
  }
};

const staticBase = environment.staticBase;
const ImagesBase = `${staticBase}/images`;
const BookImagesBase = `${ImagesBase}/book`;
const BookImageNotSet = `${BookImagesBase}/missing.png`;
const UserAvatarsBase = `${staticBase}/avatars`;
const AppPackagesBase = `${staticBase}/apks`;
const ChapPacksBase = `${staticBase}/book-chaps`;
const AppHomePage = `${staticBase}/app`;
const AppManualPage = `${staticBase}/app-man`;
const WxQrCodeUrl = `${staticBase}/wxmp/qrcode_344.jpg`;


const StaticResource = {
  BookImagesBase,
  BookImageNotSet,
  UserAvatarsBase,
  AppPackagesBase,
  ChapPacksBase,
  AppHomePage,
  AppManualPage,
  WxQrCodeUrl
};

const HeaderPrefix = 'X-';

const HeaderNames = {
  UserToken: HeaderPrefix + 'UT',
  UserName: HeaderPrefix + 'UN',
  Client: HeaderPrefix + 'CL'
};

const HeaderValues = {
  Client: 'R'/*,
  Client_Agent: 'M'*/
};

const LocalStorageKey = {
  frc: 'FRC',
  readerBG: 'RBG',
  readerLookupDict: 'RLD',
  readerMarkNewWords: 'RNW',
  readerWordsHover: 'RWH',
  readerShowTrans: 'RST',
  readerLeftRight: 'RLR'
};

const DefaultHttpHeaders = environment.httpHeaders || {};

export {
  UIConstants,
  DataAttrNames,
  DataAttrValues,
  SpecialAnnotations,
  ReaderStyles,
  StaticResource,
  HeaderNames,
  HeaderValues,
  DefaultHttpHeaders,
  LocalStorageKey
};
