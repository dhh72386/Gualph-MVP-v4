import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const json = {
  openapi: '3.1.0',
  info: {
    title: 'Gualph API',
    version: '0.2.0',
    description: 'Course operating and public booking APIs for the Gualph platform.',
  },
  servers: [{ url: '/' }],
  paths: {
    '/api/auth/login': {
      post: { summary: 'Create an operator session', tags: ['Authentication'] },
    },
    '/api/auth/register': {
      post: { summary: 'Register a course and course admin', tags: ['Authentication'] },
    },
    '/api/courses': {
      get: { summary: 'Get the authenticated course profile', tags: ['Course Management'] },
      patch: { summary: 'Update the authenticated course profile', tags: ['Course Management'] },
    },
    '/api/dashboard': {
      get: { summary: 'Get authenticated course analytics KPIs', tags: ['Analytics'] },
    },
    '/api/tee-times': {
      get: { summary: 'List authenticated course tee times', tags: ['Tee Sheet'] },
      post: { summary: 'Create a tee time for the authenticated course', tags: ['Tee Sheet'] },
    },
    '/api/reservations': {
      get: { summary: 'List authenticated course reservations', tags: ['Reservations'] },
      post: { summary: 'Create a staff-booked reservation', tags: ['Reservations'] },
    },
    '/api/reservations/{id}': {
      patch: { summary: 'Modify party size or move a reservation', tags: ['Reservations'] },
      delete: { summary: 'Cancel a reservation and reopen its tee time', tags: ['Reservations'] },
    },
    '/api/players': {
      get: { summary: 'List authenticated course players', tags: ['Players'] },
      post: { summary: 'Create a player profile', tags: ['Players'] },
    },
    '/api/pricing/recommendations': {
      get: { summary: 'List dynamic pricing recommendations', tags: ['Pricing'] },
    },
    '/api/pricing/apply': {
      post: { summary: 'Apply a recommended price to a tee time', tags: ['Pricing'] },
    },
    '/api/optimization/tee-sheet': {
      get: { summary: 'Get AI-assisted tee sheet suggestions', tags: ['Optimization'] },
    },
    '/api/reports/summary': {
      get: { summary: 'Get report summary metrics', tags: ['Reporting'] },
    },
    '/api/reports/export': {
      get: { summary: 'Export reservations as CSV', tags: ['Reporting'] },
    },
    '/api/public/courses/{slug}': {
      get: { summary: 'Get public course booking inventory', tags: ['Public Booking'] },
    },
    '/api/public/reservations': {
      post: { summary: 'Create a public golfer reservation', tags: ['Public Booking'] },
    },
  },
};

export async function GET() {
  return NextResponse.json(json);
}
