import { Routes } from "@angular/router";
import { CoinComponent } from "./pages/coin/coin.component";
import { DrawComponent } from "./pages/draw/draw.component";
import { HistoryComponent } from "./pages/history/history.component";
import { HomeComponent } from "./pages/home/home.component";
import { NumberComponent } from "./pages/number/number.component";
import { ProsConsComponent } from "./pages/pros-cons/pros-cons.component";

export const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "coin", component: CoinComponent },
  { path: "number", component: NumberComponent },
  { path: "draw", component: DrawComponent },
  { path: "pros-cons", component: ProsConsComponent },
  { path: "history", component: HistoryComponent },
  { path: "**", redirectTo: "" },
];
