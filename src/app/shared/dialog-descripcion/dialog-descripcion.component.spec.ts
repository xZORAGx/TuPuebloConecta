import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDescripcionComponent } from './dialog-descripcion.component';

describe('DialogDescripcionComponent', () => {
  let component: DialogDescripcionComponent;
  let fixture: ComponentFixture<DialogDescripcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogDescripcionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogDescripcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
