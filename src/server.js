import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({ logger: true });

await fastify.register(fastifyFormbody);
await fastify.register(fastifyCookie);
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-at-least-32-chars',
  cookie: { secure: false }
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});

fastify.get('/', (req, reply) => (req.session.user ? reply.redirect('/hub') : reply.redirect('/login')));
fastify.get('/login', (req, reply) => reply.sendFile('login.html', path.join(__dirname, '../public')));
fastify.post('/login', async (req, reply) => {
  req.session.user = { username: req.body?.username || 'developer' };
  return reply.redirect('/hub');
});
fastify.get('/hub', (req, reply) => (!req.session.user ? reply.redirect('/login') : reply.sendFile('index.html', path.join(__dirname, '../hub'))));
fastify.get('/hub/*', (req, reply) => (!req.session.user ? reply.redirect('/login') : reply.sendFile('index.html', path.join(__dirname, '../hub'))));
fastify.get('/logout', async (req, reply) => {
  await req.session.destroy();
  return reply.redirect('/login');
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });
