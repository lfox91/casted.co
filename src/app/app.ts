

import { Component } from '@angular/core';
import { Header } from './shared/header/header.component';
// import { bootstrap } from 'angular2-universal';

@Component({
  selector: 'app',
  templateURL: '<header>',
  directives: [Header]
})

export class App {
  constructor(){
    console.log('App started!');  
  } 
};

// bootstrap { App };
