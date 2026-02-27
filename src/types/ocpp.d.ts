export type OCPPConfiguration = {
    configuration_key: OCPPConfigurationItem[];
}

export type OCPPConfigurationItem = {
    key: string;
    value: string;
    readonly: boolean;
};

export type OCPPConfigurationResponse = {
    status_code: number;
    data: OCPPConfiguration | null;
    error: string | null;
}