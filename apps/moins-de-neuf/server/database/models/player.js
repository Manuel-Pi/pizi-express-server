const mongoose=require("mongoose"),PlayerSchema=new mongoose.Schema({user:String,stats:{games:{won:{type:Number,default:0},lost:{type:Number,default:0}},moinsdeneuf:{call:{type:Number,default:0},won:{type:Number,default:0},lost:{type:Number,default:0}},quickplay:{done:{type:Number,default:0},taken:{type:Number,default:0}},score:{min:{type:Number,default:0},max:{type:Number,default:0}}}});PlayerSchema.methods.updateStats=function(e){this.stats.games.won+=e.games.won,this.stats.games.lost+=e.games.lost,this.stats.moinsdeneuf.call+=e.moinsdeneuf.call,this.stats.moinsdeneuf.won+=e.moinsdeneuf.won,this.stats.moinsdeneuf.lost+=e.moinsdeneuf.lost,this.stats.quickplay.done+=e.quickplay.done,this.stats.quickplay.taken+=e.quickplay.taken,e.score<this.stats.score.min&&(this.stats.score.min=e.score),e.score>this.stats.score.max&&(this.stats.score.max=e.score),this.stats.score.max&&1===this.stats.games.played&&(this.stats.score.min=this.stats.score.max)},module.exports=mongoose.model("Player",PlayerSchema);