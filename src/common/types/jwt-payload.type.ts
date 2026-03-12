export type JwtPayload = {
    sub: number;
    email: string;
    username: string;
    role: string;
};

export type JwtPayloadWithRt = JwtPayload & { refreshToken: string };
