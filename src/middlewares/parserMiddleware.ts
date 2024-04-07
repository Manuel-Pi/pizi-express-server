import express from 'express'
import cookieParser from 'cookie-parser'

export default (options: any = {}) => [
    express.json(),
    express.urlencoded({ extended: true }),
    cookieParser()
]