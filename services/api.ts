import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefresh = false;
let failedRequestQueue = [];

export function setupAPIClient( ctx = undefined ) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["nextauth.token"]}`,
    },
  });
  
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);
  
          const { "nextauth.refreshToken": refreshToken } = cookies;
          const orignalConfig = error.config
  
          if (!isRefresh) {
            isRefresh = true;
  
            api.post("/refresh", {
                refreshToken,
              })
              .then((response) => {
                const { token } = response.data;
  
                setCookie(ctx, "nextauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: "/",
                });
  
                setCookie(ctx, "nextauth.refreshToken", response.data.refreshToken, {
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: "/",
                  }
                );
  
                api.defaults.headers["Authorization"] = `Bearer ${token}`;
  
                failedRequestQueue.forEach(request => request.resolve(token));
                failedRequestQueue = [];
              }).catch((err) => {
                failedRequestQueue.forEach(request => request.reject(err));
                failedRequestQueue = [];
  
                signOut();
              }).finally(() => {
                isRefresh = false;
              });
          }
  
          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              resolve: (token: string) => {
                orignalConfig.headers['Authorization'] = `Bearer ${token}`;
  
                resolve(api(orignalConfig));
              },
              reject: (err: AxiosError) => {
                reject(err);
              }
            })
          })
        } else {
          if (process.browser) {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }
      return Promise.reject(error)
    }
  );

  return api;
}
