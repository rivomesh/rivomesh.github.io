// Original RivoMesh geometry. No embedded fonts or third-party logo assets.
export const palette={blue:'#2859a6',light:'#94bcfa',ink:'#172a45',night:'#111c2d',paper:'#f7f9fc',line:'#dce4ef',teal:'#247f7c'}
export const concepts = {
 a:{name:'River Otter',body:'<path fill-rule="evenodd" d="M4 33C10 40 18 42 26 36C31 32 37 29 42 28C39 25 39 21 41 18C40 15 43 13 46 15L48 17C53 16 56 18 58 21L61 22C63 24 61 27 57 29L53 30C53 35 51 39 47 41L45 41C42 45 38 47 33 47L36 50C32 52 28 51 25 48L23 46C14 47 7 43 4 38C3 36 3 34 4 33ZM53 22A2.15 2.15 0 1 0 48.7 22A2.15 2.15 0 1 0 53 22Z"/>'},
 b:{name:'Kingfisher',body:'<path fill-rule="evenodd" d="M61 43L39 30C37 37 32 41 27 42L15 53L17 44L10 47L19 35C10 29 6 20 4 12C11 17 18 19 23 18C24 12 29 8 36 9C44 10 47 17 45 25L61 43ZM40 18A2.4 2.4 0 1 0 35.2 18A2.4 2.4 0 1 0 40 18Z"/>'},
 c:{name:'Swallow',body:'<path d="M60 10C57 14 53 19 49 25L46 29C51 29 57 31 61 35C53 34 46 36 41 39C38 42 34 44 30 45L15 57L21 43L5 48L23 31C19 25 13 20 4 16C13 14 24 15 32 20C40 13 49 10 60 10Z"/>'}
}
export const selected='a'
export function mark({concept=selected,color=palette.blue,tile=false,small=false}={}){
 const art=concepts[concept].body
 const background=tile?`<rect width="64" height="64" rx="${small?13:15}" fill="${palette.blue}"/>`:''
 const glyph=tile?`<g transform="translate(6 6) scale(.8125)" fill="#fff">${art}</g>`:`<g fill="${color}">${art}</g>`
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${background}${glyph}</svg>`
}
// Bespoke geometric lettering, drawn as vector paths; no font is downloaded or redistributed.
const glyphs=[
 [23,'M2 29V3h10c14 0 14 16 0 16H2m10 0 11 10'],
 [10,'M4 12v17M4 3v1'],
 [23,'m2 12 8 17 9-17'],
 [24,'M20 21c0 12-17 12-17 0s17-12 17 0Z'],
 [31,'M3 29V3l12 17L27 3v26'],
 [23,'M3 20h16c0-12-16-12-16 1 0 10 11 12 17 6'],
 [23,'M19 14c-5-5-16-3-16 3s16 3 16 9c0 5-11 7-17 2'],
 [24,'M3 3v26m0-12c3-8 16-8 16 2v10']
]
export function lettering(color=palette.ink){let x=0;return `<g fill="none" stroke="${color}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round">`+glyphs.map(([advance,d])=>{const result=`<path transform="translate(${x} 0)" d="${d}"/>`;x+=advance;return result}).join('')+'</g>'}
export function wordmark({concept=selected,dark=false,mono=false}={}){
 const text=dark?'#edf3fc':palette.ink
 const color=mono?text:dark?palette.light:palette.blue
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 304 64"><g color="${color}" fill="currentColor">${concepts[concept].body}</g><g transform="translate(79 12) scale(1.18)">${lettering(text)}</g></svg>`
}
