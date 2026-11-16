export function readState(storage,key,fallback){try{const value=storage?.getItem(key);return value===null||value===undefined?fallback:JSON.parse(value)}catch{return fallback}}
export function saveState(storage,key,value){try{storage?.setItem(key,JSON.stringify(value))}catch{}}
export function currentGroup(groups,route){return groups.find(group=>group.items.some(item=>item.route===route))?.id}
export function flatten(groups){return groups.flatMap(group=>group.items.map(item=>({...item,group:group.title})))}

export function safeStorage(type){try{return typeof window!=='undefined'?window[type]:undefined}catch{return undefined}}
