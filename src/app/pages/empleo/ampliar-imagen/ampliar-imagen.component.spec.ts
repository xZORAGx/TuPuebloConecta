import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmpliarImagenComponent } from './ampliar-imagen.component';

describe('AmpliarImagenComponent', () => {
  let component: AmpliarImagenComponent;
  let fixture: ComponentFixture<AmpliarImagenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmpliarImagenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmpliarImagenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
