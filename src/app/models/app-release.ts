import {Model} from './model';

export class AppRelease extends Model {

  platform: string;
  versionName: string;
  versionCode: number;

  releaseNote: string;
  packageInfo: PackageInfo;
  current: boolean;

}

// export const AppPlatform = {Android: 'A', IOS: 'I'};

export class PackageInfo {
  file: string;
  hash: string;
  size: number;
  uploadedAt: Date;
}
