import { Route, Routes } from "@angular/router";
import { ComingSoonComponent } from "./pages/coming-soon/coming-soon.component";
import { HomeComponent } from "./pages/home/home.component";

const tool = (path: string, title: string): Route => ({
  path,
  component: ComingSoonComponent,
  data: { title },
});

export const routes: Routes = [
  { path: "", component: HomeComponent },
  tool("coin", "Pile ou face"),
  tool("number", "Nombre aléatoire"),
  tool("draw", "Tirage au sort"),
  tool("pros-cons", "Pour / Contre"),
  tool("history", "Historique"),
  { path: "**", redirectTo: "" },
];
