export interface IVREntry {
    id: number;
    type: string;
    digit: string;
    value: string;
    _id?: string; // MongoDB adds this for saved entries
}

export interface DTMFOptions {
    announcement: {id: string, name: string};
    enableDirectDial: string;
    ignoreTrailingKey: string;
    forceStartDialTimeout: string;
    timeout: number;
    alertInfo: string;
    ringerVolumeOverride: string;
    invalidRetries: number;
    invalidRetryRecording: {id: string, name: string};
    appendAnnouncementToInvalid: string;
    returnOnInvalid: string;
    invalidRecording: {id: string, name: string};
    invalidDestination: string;
    timeoutRetries: number;
    timeoutRetryRecording: {id: string, name: string};
    appendAnnouncementOnTimeout: string;
    returnOnTimeout: string;
    timeoutRecording: {id: string, name: string};
    timeoutDestination: string;
    returnToIVRAfterVM: string;
}

export interface IVRState {
    name: string;
    description: string;
    dtmf: DTMFOptions;
    entries: IVREntry[];
}

export interface ErrorState {
    name?: string;
    announcement?: string;
    timeout?: string;
    invalidRetries?: string;
    timeoutRetries?: string;
    form?: string;
}
