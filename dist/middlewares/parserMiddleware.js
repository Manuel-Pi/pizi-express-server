import express from 'express';
import cookieParser from 'cookie-parser';
export default (options = {}) => [
    express.json(),
    express.urlencoded({ extended: true }),
    cookieParser()
];
//# sourceMappingURL=parserMiddleware.js.map