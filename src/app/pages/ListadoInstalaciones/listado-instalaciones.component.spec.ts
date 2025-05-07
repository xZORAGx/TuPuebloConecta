import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoInstalacionesComponent } from './listado-instalaciones.component';

describe('ListadoInstalacionesComponent', () => {
  let component: ListadoInstalacionesComponent;
  let fixture: ComponentFixture<ListadoInstalacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoInstalacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListadoInstalacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
