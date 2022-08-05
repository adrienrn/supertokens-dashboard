/* Copyright (c) 2022, VRAI Labs and/or its affiliates. All rights reserved.
*
* This software is licensed under the Apache License, Version 2.0 (the
* "License") as published by the Apache Software Foundation.
*
* You may not use this file except in compliance with the License. You may
* obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*/

import { StorageKeys, UNAUTHORISED_STATUS } from "./constants";
import NetworkManager from "./services/network";
import { localStorageHandler } from "./services/storage";
import { HttpMethod } from "./types";

export interface ListCount {count: number}
export interface ResponseList<T>  {
    nextPaginationToken?: string
    status: Response['status'],
    users: T[]
}

export function getStaticBasePath(): string {
    return (window as any).staticBasePath;
}

export function getDashboardAppBasePath(): string {
    return (window as any).dashboardAppPath;
}

export function getImageUrl(imageName: string): string {
    return getStaticBasePath() + "/media/" + imageName;
}

export function getApiUrl(path: string): string {
    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    return window.location.origin + getDashboardAppBasePath() + path;
}

export const fetchDataAndRedirectIf401 = async ({
    url,
    method,
    query,
    config
}: {
    url: string,
    method: HttpMethod,
    query?: {[key: string]: string},
    config?: RequestInit,
}) => {
    const response = await fetchData({ url, method, query, config });

    if (response.status === UNAUTHORISED_STATUS) {
        window.location.assign(getDashboardAppBasePath() + "/auth")
    }

    return response;
}

export const fetchData = async ({
    url,
    method,
    query,
    config
}: {
    url: string,
    method: HttpMethod,
    query?: {[key: string]: string},
    config?: RequestInit,
}) => {
    const apiKeyInStorage = localStorageHandler.getItem(StorageKeys.API_KEY);
    
    let additionalHeaders: {[key: string] : string} = {};

    if (apiKeyInStorage !== undefined) {
        additionalHeaders = {
            ...additionalHeaders,
            authorization: `Bearer ${apiKeyInStorage}`,
        }
    }

    const response: Response = await NetworkManager.doRequest({
        url,
        method,
        query,
        config: {
            ...config,
            headers: {
                ...config?.headers,
                ...additionalHeaders,
            },
        },
    });

    return response;
}

/**
 * Get Ordinal text from number 
 ** 1 -> st
 ** 2 -> nd
 ** 3 -> rd
 ** 4 -> th
 */
export const ordinal = (num: number) => {
  const mod = num % 10
  const modMap: Record<number, string> = {1: 'st',2: 'nd',3: 'rd'}
  return num >10 && num < 14 ? 'th' : (modMap[mod] ?? 'th')
}

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
/**
 * Output long date
 ** example: 5th August, 03:35 pm
 * @param date epooch number, or Date object
 */
export const formatLongDate = (date: number | Date) => {
  if (typeof date === 'number') { date = new Date(date) }
  const day = date.getDate()
  const hour = date.getHours();
  const meridiem = hour < 12 ? 'am' : 'pm'
  return `${day}${ordinal(day)} ${months[date.getMonth()]}, 
  ${(hour % 12 || 12).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')} ${meridiem}`
}