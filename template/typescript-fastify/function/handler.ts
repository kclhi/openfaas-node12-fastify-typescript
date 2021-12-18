import { ContextPayload, EventPayload } from './types';
import winston from 'winston';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({level:'info', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  const result = {
    message: `Body: ${JSON.stringify(event.body)}`,
  };
  return context.code(200).send(result);
};
