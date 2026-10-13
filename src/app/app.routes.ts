import { Route, Routes } from "@angular/router";
import { ComingSoonComponent } from "./pages/coming-soon/coming-soon.component";
import { CoinComponent } from "./pages/coin/coin.component";
import { HomeComponent } from "./pages/home/home.component";
import { NumberComponent } from "./pages/number/number.component";

const tool = (path: string, title: string): Route => ({
  path,
  component: ComingSoonComponent,
  data: { title },
});

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "coin", component: CoinComponent },
  { path: "number", component: NumberComponent },
  tool("draw", "Tirage au sort"),
  tool("pros-cons", "Pour / Contre"),
  tool("history", "Historique"),
  { path: "**", redirectTo: "" },
];
