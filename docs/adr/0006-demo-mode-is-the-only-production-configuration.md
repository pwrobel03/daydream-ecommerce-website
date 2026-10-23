# 0006. Demo mode is the only production configuration

- Status: Accepted
- Date: 2026-10-23

## Context

Daydream is published as a portfolio project for recruiters and developers. It is not a commercial shop
and must not become one by accident. Visitors should be able to try everything, including the
back-office, without damaging the demo for the next visitor.

## Recommendation

The application runs in production only as the portfolio demo, because there is no real shop to support
and every extra configuration is one more way to become one by accident.

- **Demo notice:** a persistent, non-dismissible banner on every page, in EN and PL, says this is a
  portfolio demo and not a real shop. The checkout and payment screens add a note with the Stripe test
  card.
- **Demo admin account:** stays public. Its admin writes are blocked and the back-office is browsable
  read-only. The owner's private admin keeps full rights (ADR 0009, 0011).
- **Demo reset:** restores the seed state. The reset script is part of the application; the owner runs
  it on the server, by hand rather than on a schedule (ADR 0010).
- **Test payments only:** see ADR 0005.

What exactly demo mode restricts is proposed in ADR 0009; the reset in ADR 0010.

## Alternatives considered

- **Supporting both a real shop and a demo** — doubles the configuration surface for a use the owner
  rules out.

## Consequences

- Production configuration validation can assume demo mode and refuse anything else.
- Features that only make sense in a real shop (live payments, fulfilment of real goods) need not be
  production-ready. Outgoing e-mail does work, behind hard limits (ADR 0012).
