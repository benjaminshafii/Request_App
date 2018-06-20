import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from '@angular/forms';
import { Web3Service } from '../../util/web3.service';

@Component({
  templateUrl: './additional-dialog.component.html'
})
export class AdditionalDialogComponent implements OnInit {
  requestObject: any;
  request: any;
  additionalForm: FormGroup;
  additionalAmountFormControl: FormControl;
  loading: boolean;
  callbackTx: any;

  constructor(
    public web3Service: Web3Service,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AdditionalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    this.requestObject = data.requestObject;
    this.request = data.requestObject.requestData;
    this.callbackTx = data.callbackTx;
    this.loading = false;
  }

  ngOnInit() {
    this.additionalAmountFormControl = new FormControl('', [
      Validators.required,
      Validators.pattern('[0-9]*([.][0-9]{0,18})?$')
    ]);
    this.additionalForm = this.formBuilder.group({
      additionalAmountFormControl: this.additionalAmountFormControl
    });
  }

  submit() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.web3Service
      .additional(this.requestObject, this.additionalAmountFormControl.value)
      .on('broadcasted', response => {
        this.callbackTx(
          response,
          'Additional in progress. Please wait a few moments for it to appear on the Blockchain.'
        );
        this.dialogRef.close();
      })
      .catch(err => {
        this.loading = false;
        this.callbackTx(err);
      });
  }
}
