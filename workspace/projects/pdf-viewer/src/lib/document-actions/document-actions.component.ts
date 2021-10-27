import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { DocumentComponent } from '../document/document.component';
import { PdfViewerService } from '../pdf-viewer.service';
import { DocumentActions } from '../_config/document-actions.model';
import { DocumentConfig } from '../_config/document.model';

@Component({
  selector: 'lib-document-actions',
  templateUrl: './document-actions.component.html',
  styleUrls: ['./document-actions.component.scss'],
})
export class DocumentActionsComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @Input('document') document: DocumentComponent | undefined;
  @Input('documentConfig') documentConfig: DocumentConfig = {
    containerWidth: 0,
    containerHeight: 0,
  };
  @Input('documentActionsSrc') documentActionsSrc: DocumentActions = {
    zoomInSrc: '',
    zoomOutSrc: '',
    fitToPageSrc: '',
    informationHelp: '',
    downloadPdfPlain: '',
  };
  defaultConfig: DocumentConfig = { containerWidth: 0, containerHeight: 0 };
  zoomInDisabled = false;
  zoomOutDisabled = false;
  destroy$ = new Subject();
  documentPage: HTMLElement | null = null;
  transImg: any;
  incrementScale = 1;
  ZOOM_STEP = 1.12;
  pageHeight: number = 0;
  pageWidth: number = 0;
  subscriptions = new Subscription();

  constructor(private pdfViewerService: PdfViewerService) {}

  ngOnInit(): void {
    this.documentPage = document.getElementById('document-page');
    this.transImg = document.getElementById('trans-img');
    this.subscriptions = this.pdfViewerService.fitToPage.subscribe(
      (res: boolean) => {
        if (res) {
          this.fitToPage();
        }
      }
    );
  }

  ngAfterViewInit() {
    this.defaultConfig = { ...this.documentConfig };
    this.pageHeight = this.defaultConfig.containerHeight;
    this.pageWidth = this.defaultConfig.containerWidth;
    this.scrollEvent();
  }

  zoomInImg() {
    if (this.documentConfig.containerHeight > 2200) {
      this.zoomInDisabled = true;
    } else {
      this.pdfViewerService.docConfSubject.next({
        containerHeight: this.ZOOM_STEP * this.documentConfig.containerHeight,
        containerWidth: this.ZOOM_STEP * this.documentConfig.containerWidth,
      });
      setTimeout(() => {
        const textLayer = document.getElementById('textLayer');
        const zoomLevel =
          (this.documentConfig.containerHeight * this.ZOOM_STEP) /
          this.pageHeight;
        if (textLayer) {
          textLayer.style.transform = 'scale(' + zoomLevel + ')';
        }
        this.documentConfig.containerHeight =
          this.ZOOM_STEP * this.documentConfig.containerHeight;
        this.documentConfig.containerWidth =
          this.ZOOM_STEP * this.documentConfig.containerWidth;
        this.scrollEvent();
      }, 0);

      this.zoomOutDisabled = false;
    }
  }

  zoomOutImg() {
    if (this.documentConfig.containerHeight <= 400) {
      this.zoomOutDisabled = true;
    } else {
      this.pdfViewerService.docConfSubject.next({
        containerHeight: this.documentConfig.containerHeight / this.ZOOM_STEP,
        containerWidth: this.ZOOM_STEP * this.documentConfig.containerWidth,
      });
      setTimeout(() => {
        const textLayer = document.getElementById('textLayer');
        const zoomLevel =
          this.documentConfig.containerHeight /
          this.ZOOM_STEP /
          this.pageHeight;
        if (textLayer) {
          textLayer.style.transform = 'scale(' + zoomLevel + ')';
        }
        this.documentConfig.containerHeight =
          this.documentConfig.containerHeight / this.ZOOM_STEP;
        this.documentConfig.containerWidth =
          this.documentConfig.containerWidth / this.ZOOM_STEP;
        this.scrollEvent();
      }, 0);

      this.zoomInDisabled = false;
    }
  }

  fitToPage() {
    this.pdfViewerService.docConfSubject.next({
      containerHeight: this.pageHeight,
      containerWidth: this.pageWidth,
    });
    setTimeout(() => {
      const textLayer = document.getElementById('textLayer');
      this.zoomInDisabled = false;
      this.zoomOutDisabled = false;
      if (textLayer) {
        console.log('ima lehjere');
        textLayer.style.transform = 'scale(1)';
      } else {
        console.log('nema lejera');
      }
      this.documentConfig.containerHeight = this.pageHeight;
      this.documentConfig.containerWidth = this.pageWidth;
      this.scrollEvent();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documentConfig'] && changes['documentConfig'].currentValue) {
      this.documentConfig = changes['documentConfig'].currentValue;
      this.scrollEvent();
    }
  }

  scrollEvent() {
    const documentContainer = document.getElementById('document-container');
    if (documentContainer) {
      console.log(documentContainer.scrollHeight);
      if (documentContainer.scrollWidth > documentContainer.clientWidth) {
        this.pdfViewerService.zoomXStatus.next(true);
      } else {
        this.pdfViewerService.zoomXStatus.next(false);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }
}
