import {
	DomController,
	NavController,
	NavParams,
	Transition,
	Ion,
	PanGesture,
	Gesture,
	GestureController,
	Config,
	Platform,
    Animation,
    ToastController
} from 'ionic-angular';
import { DIRECTION_HORIZONTAL, DIRECTION_VERTICAL } from 'ionic-angular/gestures/hammer';
import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    OnDestroy,
    OnInit,
    Renderer,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { ImageViewerSrcAnimation } from './image-viewer-src-animation';
import { ImageViewerTransitionGesture } from './image-viewer-transition-gesture';
import { ImageViewerZoomGesture } from './image-viewer-zoom-gesture';
import { ImageViewerEnter, ImageViewerLeave } from './image-viewer-transitions';
import { SocialSharing } from "@ionic-native/social-sharing";

@Component({
	selector: 'image-viewer',
	template: `
		<ion-header no-border>
			<ion-navbar>
			</ion-navbar>
		</ion-header>

		<ion-backdrop (click)="bdClick()"></ion-backdrop>

		<div class="image-wrapper">
			<div class="image" #imageContainer>
				<img [src]="imageUrl" tappable #image />
			</div>
		</div>

		<ion-footer>
			<ion-row align-items-center justify-content-center>
				<button ion-button (tap)="openShareSheet(imageUrl)" clear color="white">
					<ion-icon name="share"></ion-icon>
				</button>
			</ion-row>
		</ion-footer>
	`,
	styles: [],
	providers: [SocialSharing],
	encapsulation: ViewEncapsulation.None
})
export class ImageViewerComponent extends Ion implements OnInit, OnDestroy, AfterViewInit
{
	public imageUrl: SafeUrl;
	private imageUrlString: string;

	public dragGesture: ImageViewerTransitionGesture;

	@ViewChild('imageContainer') imageContainer;
	@ViewChild('image') image;

	private pinchGesture: ImageViewerZoomGesture;

	public isZoomed: boolean;

	private unregisterBackButton: Function;

	constructor(
		public _gestureCtrl: GestureController,
		public elementRef: ElementRef,
		private _nav: NavController,
		private _zone: NgZone,
		private renderer: Renderer,
		private domCtrl: DomController,
		private platform: Platform,
		private _navParams: NavParams,
		private _socialShare: SocialSharing,
		private _toastCtrl: ToastController,
		_config: Config,
		private _sanitizer: DomSanitizer
	) {
		super(_config, elementRef, renderer);

		const url = _navParams.get('image');
		this.updateImageSrc(url);
	}

	updateImageSrc(src) {
		this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(src);
		this.imageUrlString = src;
	}

	updateImageSrcWithTransition(src) {
		const imageElement = this.image.nativeElement;
		const lowResImgWidth = imageElement.clientWidth;

		this.updateImageSrc(src);

		const animation = new ImageViewerSrcAnimation(this.platform, this.image);
		imageElement.onload = () => animation.scaleFrom(lowResImgWidth);
	}

	ngOnInit() {
		const navPop = () => this._nav.pop();

		this.unregisterBackButton = this.platform.registerBackButtonAction(navPop);
		this._zone.runOutsideAngular(() => this.dragGesture = new ImageViewerTransitionGesture(this.platform, this, this.domCtrl, this.renderer, navPop));
	}

	ngAfterViewInit() {
		// imageContainer is set after the view has been initialized
		this._zone.runOutsideAngular(() => this.pinchGesture = new ImageViewerZoomGesture(this, this.imageContainer, this.platform, this.renderer));
	}

	ngOnDestroy() {
		this.dragGesture && this.dragGesture.destroy();
		this.pinchGesture && this.pinchGesture.destroy();

		this.unregisterBackButton();
	}

	bdClick() {
		if (this._navParams.get('enableBackdropDismiss')) {
			this._nav.pop();
		}
	}

	openShareSheet()
	{
		console.log('image', this.imageUrlString);
		if (this.imageUrlString)
		{
			if (this.platform.is('cordova'))
			{
				const options = {
					files: [this.imageUrlString],
					// customClass: this.activeTheme
				};

				this._socialShare.shareWithOptions(options).then((response) => {
					// console.log('Shared via options', JSON.stringify(success));
					if (response.completed === true) {

						let toast = this._toastCtrl.create({
							message: 'Exportiert',
							duration: 3000,
							position: 'middle',
							showCloseButton: false,
							cssClass: 'success-center'
						});

						toast.present();
					}

				}).catch(() => {
				});
			}
			else {
				// Construct downloadable
				const link = document.createElement("a");
				link.download = name;
				link.href = this.imageUrlString;
				document.body.appendChild(link);
				link.click();

				// Cleanup the DOM
				document.body.removeChild(link);
			}
		}
	}
}
