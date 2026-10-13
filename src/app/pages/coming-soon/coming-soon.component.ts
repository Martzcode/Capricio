import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

/**
 * Page d'attente générique (F1) : chaque route d'outil existe dès l'accueil
 * pour une navigation réelle, le contenu arrive aux étapes 5-9.
 */
@Component({
  selector: "app-coming-soon",
  imports: [RouterLink],
  template: `
    <section class="soon" aria-labelledby="soon-title">
      <p class="soon-kicker">Capricio · bientôt disponible</p>
      <h1 id="soon-title">{{ title }}</h1>
      <p>L'outil « {{ title }} » arrive à son étape dédiée (plan : étapes 5 à 9).</p>
      <a class="btn-primary" routerLink="/">← Retour à l'accueil</a>
    </section>
  `,
  styles: [
    `
      .soon {
        max-width: 560px;
        margin: 48px auto;
        padding: 32px;
        text-align: center;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
      }
      .soon-kicker {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .soon h1 {
        margin: 0 0 8px;
        font-size: 1.5rem;
      }
      .soon p {
        margin: 0 0 20px;
      }
      .soon a {
        text-decoration: none;
      }
    `,
  ],
})
export class ComingSoonComponent {
  readonly title: string = (inject(ActivatedRoute).snapshot.data["title"] as string) ?? "Outil";
}
