const mongoose=require("mongoose"),PlayerSchema=new mongoose.Schema({user:String,stats:{games:{played:{type:Number,default:0},won:{type:Number,default:0},lost:{type:Number,default:0},ratio:{type:Number,default:0}},moinsdeneuf:{call:{type:Number,default:0},won:{type:Number,default:0},lost:{type:Number,default:0},ratio:{type:Number,default:0}},quickplay:{done:{type:Number,default:0},taken:{type:Number,default:0}},score:{min:{type:Number,default:0},max:{type:Number,default:0}}}});PlayerSchema.methods.updateStats=function(t){this.stats.games.played+=t.games.played,this.stats.games.won+=t.games.won,this.stats.games.lost+=t.games.lost,this.stats.games.ratio=getRatio(this.stats.games.won,this.stats.games.played),this.stats.moinsdeneuf.call+=t.moinsdeneuf.call,this.stats.moinsdeneuf.won+=t.moinsdeneuf.won,this.stats.moinsdeneuf.lost+=t.moinsdeneuf.lost,this.stats.moinsdeneuf.ratio=getRatio(this.stats.moinsdeneuf.won,this.stats.moinsdeneuf.call),this.stats.quickplay.done+=t.quickplay.done,this.stats.quickplay.taken+=t.quickplay.taken,t.score<this.stats.score.min&&(this.stats.score.min=t.score),t.score>this.stats.score.max&&(this.stats.score.max=t.score),this.stats.score.max&&1===this.stats.games.played&&(this.stats.score.min=this.stats.score.max)};const getRatio=(t,s)=>s?Math.round(t/s*100):0;module.exports=mongoose.model("Player",PlayerSchema);