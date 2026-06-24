export interface Match { match_id:string; player1:string; player2:string; score?:string; status:string; tournament?:string; serve?:string|null; round?:string|null }
export interface Tournament { id:string; name:string; surface:string; country:string }
export interface Player { player_id:string; name:string; country?:string; ranking?:number }
