//ver1.0.0
//Author: Nishisonic

Image = Java.type("org.eclipse.swt.graphics.Image");
GC = Java.type("org.eclipse.swt.graphics.GC");
Display = Java.type("org.eclipse.swt.widgets.Display");
SWT = Java.type("org.eclipse.swt.SWT");
ImageData = Java.type("org.eclipse.swt.graphics.ImageData");

function reSize(imageArray,width,height){
	var scaled = new Image(Display.getDefault(), width, height);
	var gc = new GC(scaled);
	gc.setAntialias(SWT.ON);
	gc.setInterpolation(SWT.HIGH);
	for(var i = 0;i < imageArray.length;i++){
		gc.drawImage(imageArray[i], 0, 0, imageArray[i].getBounds().width, imageArray[i].getBounds().height, 0, 0, width, height);
	}
	gc.dispose();
	//本来なら廃棄すべきだが、再利用するので残す
	//○○.dispose(); // don't forget about me!
	return scaled;
}

function monochrome(image){
	// 画像処理用データ取得
	// Imageのままでは画素取得とか出来ないので……
	var id = image.getImageData();

	// 画像のサイズ取得
	var width  = id.width;
	var height = id.height;
	
	// 新しい画像（の中身）を作る
	// こっちを編集する
	var idmono = new ImageData(width, height, id.depth, id.palette);

	// それぞれ、Colour、Red、Green、Blue、Monochromeの略
	var c, r, g, b, m;

	// 画素を一つ一つ取得し、順次処理
	for (var x = 0; x < width; ++x) {
		for (var y = 0; y < height; ++y) {
			// 画素を取得し、RGBに分解する
			c = id.getPixel(x, y);
			r =  c        & 0xff;
			g = (c >> 8 ) & 0xff;
			b = (c >> 16) & 0xff;

			// モノクロに用いる色を生成
			// cを使い回していることに注意
			m = Math.round((r + g + b)/3);
			if (m > 255) m = 255;
			else if (m < 0) m = 0;
			c = (m << 16) + (m << 8) + m;

			// 生成した色を収める
			idmono.setPixel(x, y, c);
		}
	}

	var monoImage = new Image(null, idmono);
	return monoImage;
}
