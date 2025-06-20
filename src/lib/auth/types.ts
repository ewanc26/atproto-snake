export interface Profile {
    avatar: string | null;
    banner: string | null;
    displayName: string | null;
    did: string;
    handle: string;
    description: string | null;
    pds: string;
}

export interface ATProtoSession {
    did: string;
    handle: string;
    accessJwt: string;
    refreshJwt: string;
    pdsUrl: string;
}

export interface PDSInfo {
    url: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    issuer: string;
}