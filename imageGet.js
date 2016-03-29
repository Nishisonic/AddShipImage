//ver1.0.0
//Author: Nishisonic

load("script/imageProcess.js");
load("script/ScriptData.js");

Image = Java.type("org.eclipse.swt.graphics.Image");
File = Java.type("java.io.File");

data_prefix = "shipListImage_";

function getFormatImage(ship){
	var imageArray = [];
	var width = 80;
	var height = 20;
	//撃沈
	if(ship.isSunk()){
		imageArray[imageArray.length] = monochrome(getShipImage(ship));
		imageArray[imageArray.length] = getData("sunkImage");
	} else {
		imageArray.push(getShipImage(ship));
		//修復中
		if(ndockShips.contains(ship.id)){
			imageArray[imageArray.length] = getData("repairImage");
		//遠征中
		} else if(missionShips.contains(ship.id)){
			imageArray[imageArray.length] = getData("missionImage");
		//それ以外
		} else {
			//大破
			if(ship.isBadlyDamage()){
				imageArray[imageArray.length] = getData("badlyImage");
				imageArray[imageArray.length] = getData("badlySmokeImage");
			//中破
			} else if(ship.isHalfDamage()){
				imageArray[imageArray.length] = getData("halfImage");
				imageArray[imageArray.length] = getData("halfSmokeImage");
			//小破
			} else if(ship.isSlightDamage()){
				imageArray[imageArray.length] = getData("slightImage");
				imageArray[imageArray.length] = getData("slightSmokeImage");
			}
		}
		//赤疲労
		if(ship.getCond() < 20) imageArray[imageArray.length] = getData("redCondImage");
		//橙疲労
		if(ship.getCond() < 30) imageArray[imageArray.length] = getData("orangeCondImage");
		//キラ
		if(ship.getCond() > 49) imageArray[imageArray.length] = getData("kiraCondImage");
		//ケッコンカッコカリ
		if(ship.getLv() > 99) imageArray[imageArray.length] = getData("weddingImage");
	}
	return reSize(imageArray,width,height);
}

//保存（また後で呼び出し）
function initializeLayerImage(){
	var sunkPath         = ".\\script\\shipImage\\Layer\\Sunk.png";
	var repairPath       = ".\\script\\shipImage\\Layer\\Repair.png";
	var missionPath      = ".\\script\\shipImage\\Layer\\Mission.png";
	var redCondPath      = ".\\script\\shipImage\\Layer\\RedCond.png";
	var orangeCondPath   = ".\\script\\shipImage\\Layer\\OrangeCond.png";
	var kiraCondPath     = ".\\script\\shipImage\\Layer\\KiraCond.png";
	var badlyPath        = ".\\script\\shipImage\\Layer\\Badly.png";
	var badlySmokePath   = ".\\script\\shipImage\\Layer\\BadlySmoke.png";
	var halfPath         = ".\\script\\shipImage\\Layer\\Half.png";
	var halfSmokePath    = ".\\script\\shipImage\\Layer\\HalfSmoke.png";
	var slightPath       = ".\\script\\shipImage\\Layer\\Slight.png";
	var slightSmokePath  = ".\\script\\shipImage\\Layer\\SlightSmoke.png";
	var weddingPath      = ".\\script\\shipImage\\Layer\\Wedding.png";
	var sunkImage        = new Image(null, sunkPath       );
	var repairImage      = new Image(null, repairPath     );
	var missionImage     = new Image(null, missionPath    );
	var redCondImage     = new Image(null, redCondPath    );
	var orangeCondImage  = new Image(null, orangeCondPath );
	var kiraCondImage    = new Image(null, kiraCondPath   );
	var badlyImage       = new Image(null, badlyPath      );
	var badlySmokeImage  = new Image(null, badlySmokePath );
	var halfImage        = new Image(null, halfPath       );
	var halfSmokeImage   = new Image(null, halfSmokePath  );
	var slightImage      = new Image(null, slightPath     );
	var slightSmokeImage = new Image(null, slightSmokePath);
	var weddingImage     = new Image(null, weddingPath    );
	setTmpData("sunkImage", sunkImage);
	setTmpData("repairImage", repairImage);
	setTmpData("missionImage", missionImage);
	setTmpData("redCondImage", redCondImage);
	setTmpData("orangeCondImage", orangeCondImage);
	setTmpData("kiraCondImage", kiraCondImage);
	setTmpData("badlyImage", badlyImage);
	setTmpData("badlySmokeImage", badlySmokeImage);
	setTmpData("halfImage", halfImage);
	setTmpData("halfSmokeImage", halfSmokeImage);
	setTmpData("slightImage", slightImage);
	setTmpData("slightSmokeImage", slightSmokeImage);
	setTmpData("weddingImage", weddingImage);
	for(var i = 1;i < 501;i++){
		var NshipPath = ".\\script\\shipImage\\Normal\\" + i + ".jpg";
		var DshipPath = ".\\script\\shipImage\\Damage\\" + i + ".jpg";
		var Nfile      = new File(NshipPath);
		var Dfile      = new File(DshipPath);
		if(Nfile.exists() && Dfile.exists()){
			var NshipImage = new Image(null, NshipPath);
			var DshipImage = new Image(null, DshipPath);
			setTmpData("N" + i, NshipImage);
			setTmpData("D" + i, DshipImage);
		}
	}
}

function getShipImage(ship){
	//通常
	if(!ship.isHalfDamage()) return getData("N" + ship.shipId);
	//中破以上
	return getData("D" + ship.shipId);
}

function shipImageLoadCheck(){
	return getData("isShipLoad") == null;
}

function shipImageLoad(){
	setTmpData("isShipLoad" ,false);
	initializeLayerImage();
}
