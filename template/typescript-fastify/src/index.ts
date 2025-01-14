/* eslint-disable max-classes-per-file */
import fastify, {FastifyInstance, FastifyRequest} from 'fastify';
import {Server, IncomingMessage, ServerResponse, IncomingHttpHeaders, OutgoingHttpHeaders} from 'http';

import cors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyFormBody from '@fastify/formbody';
import multipart from '@fastify/multipart';

import {ContextPayload, EventPayload} from './types';

import handler from '../function/handler';

class Event implements EventPayload {
  body:unknown;

  headers:IncomingHttpHeaders;

  method:string;

  query:unknown;

  path:string;

  constructor(req:FastifyRequest) {
    this.body = req.body;
    this.headers = req.headers;
    this.method = req.method;
    this.query = req.query;
    this.path = req.url;
  }
}

class Context implements ContextPayload {
  statusCode:number;

  headerValues:OutgoingHttpHeaders;

  result:unknown;

  error:Error | null;

  constructor() {
    // Assumes the default response
    this.statusCode = 200;
    this.headerValues = {};
    this.result = null;
    this.error = null;
  }

  code(statusCode?:number):this {
    if(!statusCode) {
      return this;
    }

    this.statusCode = statusCode;
    return this;
  }

  headers(headerValues?:OutgoingHttpHeaders):this {
    if(!headerValues) {
      return this;
    }

    this.headerValues = headerValues;
    return this;
  }

  send(result:unknown):this {
    this.result = result;
    return this;
  }

  err(error:Error):this {
    this.error = error;
    return this;
  }
}

const SERVER:FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
  logger: process.env.ENABLE_LOGGING === 'true'
});

SERVER.register(fastifyHelmet);
SERVER.register(fastifyFormBody);
SERVER.register(multipart, {attachFieldsToBody: 'keyValues'});

SERVER.register(cors, {
  origin: (origin, callback) => {
    if(process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    if(process.env?.CORS_ORIGIN == '*') {
      callback(null, true);
      return;
    }
    if(/localhost/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Illegal origin '${origin}'`), false);
  }
});

SERVER.route({
  url: '/*',
  method: ['GET', 'POST', 'DELETE', 'PUT'],
  handler: async(req, res) => {
    const event = new Event(req);
    const context = new Context();

    try {
      const handlerRes = await handler(event, context);

      res.headers(handlerRes.headerValues).status(handlerRes.statusCode);
      return handlerRes.result;
    } catch(err) {
      return res.code(500);
    }
  }
});

SERVER.listen({port: 3000, host: '0.0.0.0'}, (err, address) => {
  if(err) throw err;

  SERVER.log.info(`server listening on ${address}`);
});

export default SERVER;
