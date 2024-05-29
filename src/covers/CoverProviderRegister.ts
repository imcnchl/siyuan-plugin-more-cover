import {CoverProvider} from "./CoverProvider";
import {UnsplashConfig, UnsplashProvider} from "./UnsplashProvider";
import {PixabayConfig, PixabayProvider} from "./PixabayProvider";

export const unsplashProvider = new UnsplashProvider(new UnsplashConfig());
export const pixabayProvider = new PixabayProvider(new PixabayConfig());

export const coverProviders: Array<CoverProvider<any>> = [
    unsplashProvider,
    pixabayProvider,
];